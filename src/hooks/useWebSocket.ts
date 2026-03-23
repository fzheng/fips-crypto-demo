import { useEffect, useRef, useCallback, useState } from 'react';
import { WsClient, type ConnectionState } from '../protocol/ws-client';
import type { ServerMessage } from '../protocol/messages';
import { useIdentityStore } from '../store/identity-store';
import { usePeerStore } from '../store/peer-store';
import { useSessionStore } from '../store/session-store';
import { useMessageStore } from '../store/message-store';
import { getServerUrl } from '../store/settings-store';
import { toBase64, fromBase64, fromBytes } from '../crypto/encoding';
import { encapsulateSession, decapsulateSession } from '../crypto/kem';
import { encrypt, encryptString, decrypt } from '../crypto/symmetric';
import { signMessage, verifySignature } from '../crypto/signing';
import { buildSignedEnvelope } from '../crypto/envelope';

/** uuid() is unavailable in insecure contexts (HTTP over LAN). */
function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  (typeof crypto !== 'undefined' ? crypto : { getRandomValues: (b: Uint8Array) => { for (let i = 0; i < b.length; i++) b[i] = Math.random() * 256 | 0; return b; } }).getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

/** Max payload size we'll accept from the relay (6 MB base64 ≈ ~4.5 MB raw) */
const MAX_PAYLOAD_BASE64_LENGTH = 8 * 1024 * 1024;

/**
 * Verify that the DSA public key in a KE payload matches the key
 * we discovered for this peer via the relay's peer-list / peer-joined.
 * Returns the pinned key if matched, or null if untrusted.
 */
function getPinnedDsaKey(peerId: string, claimedKeyB64: string): Uint8Array | null {
  const peer = usePeerStore.getState().peers.get(peerId);
  if (!peer) return null;
  if (peer.mlDsaPublicKey !== claimedKeyB64) {
    console.warn(`[security] ${peerId}: KE DSA key does not match discovered key. Rejecting.`);
    return null;
  }
  return fromBase64(claimedKeyB64);
}

async function onServerMessage(msg: ServerMessage, clientRef: React.RefObject<WsClient | null>) {
  const id = useIdentityStore.getState().identity;

  switch (msg.type) {
    case 'registered':
      break;

    case 'peer-list':
      usePeerStore.getState().setPeers(msg.peers);
      break;

    case 'peer-joined':
      usePeerStore.getState().addPeer({
        peerId: msg.peerId,
        mlDsaPublicKey: msg.mlDsaPublicKey,
      });
      break;

    case 'peer-left':
      usePeerStore.getState().removePeer(msg.peerId);
      useSessionStore.getState().removeSession(msg.peerId);
      break;

    case 'relayed': {
      const { from, payload } = msg;
      if (!id) return;

      switch (payload.kind) {
        case 'ke-init': {
          // FIX 1: Pin DSA key against discovered peer identity
          const peerDsaPub = getPinnedDsaKey(from, payload.mlDsaPublicKey);
          if (!peerDsaPub) break; // reject untrusted KE

          const peerKemPub = fromBase64(payload.mlKemPublicKey);
          const { ciphertext, session } = await encapsulateSession(peerKemPub, peerDsaPub);

          useSessionStore.getState().establishSession(
            from,
            session.sharedSecret,
            session.peerDsaPublicKey,
          );

          clientRef.current?.send({
            type: 'relay',
            to: from,
            payload: {
              kind: 'ke-response',
              mlKemCiphertext: toBase64(ciphertext),
              mlDsaPublicKey: toBase64(id.dsa.publicKey),
            },
          });
          break;
        }

        case 'ke-response': {
          const sess = useSessionStore.getState().getSession(from);
          if (!sess?.pendingKemSecretKey) break;

          // FIX 1: Pin DSA key against discovered peer identity
          const peerDsaPub = getPinnedDsaKey(from, payload.mlDsaPublicKey);
          if (!peerDsaPub) break; // reject untrusted KE

          const ct = fromBase64(payload.mlKemCiphertext);
          const session = await decapsulateSession(ct, sess.pendingKemSecretKey, peerDsaPub);

          useSessionStore.getState().establishSession(
            from,
            session.sharedSecret,
            session.peerDsaPublicKey,
          );
          break;
        }

        case 'chat': {
          const sess = useSessionStore.getState().getSession(from);
          if (!sess?.sharedSecret || !sess.peerDsaPublicKey) break;

          // FIX 4: Reject oversized payloads
          if (payload.ciphertext.length > MAX_PAYLOAD_BASE64_LENGTH) {
            console.warn(`[security] ${from}: payload too large (${payload.ciphertext.length} chars). Dropping.`);
            break;
          }

          const ciphertext = fromBase64(payload.ciphertext);
          const signature = fromBase64(payload.signature);

          // FIX 3: Verify signature over the full envelope (ciphertext + metadata)
          const envelope = buildSignedEnvelope(
            ciphertext,
            payload.messageType,
            payload.timestamp,
            payload.fileName,
            payload.fileType,
          );

          const verifyStart = performance.now();
          const signatureValid = await verifySignature(sess.peerDsaPublicKey, envelope, signature);
          const verifyTimeMs = performance.now() - verifyStart;

          // FIX 2: Reject invalid signatures — do NOT decrypt or render
          if (!signatureValid) {
            console.warn(`[security] ${from}: invalid signature. Message rejected.`);
            useMessageStore.getState().addMessage(from, {
              id: uuid(),
              peerId: from,
              fromSelf: false,
              text: '[Message rejected: invalid signature]',
              timestamp: payload.timestamp,
              signatureValid: false,
              crypto: {
                ciphertextSize: ciphertext.length,
                signatureSize: signature.length,
                verifyTimeMs,
              },
            });
            break;
          }

          // Signature valid — now decrypt
          const decryptStart = performance.now();
          let decryptedBytes: Uint8Array;
          try {
            decryptedBytes = decrypt(sess.sharedSecret, ciphertext);
          } catch {
            console.warn(`[security] ${from}: decryption failed.`);
            break;
          }
          const decryptTimeMs = performance.now() - decryptStart;

          const isFile = payload.messageType === 'file';
          const text = isFile
            ? (payload.fileName ?? 'file')
            : fromBytes(decryptedBytes);

          const chatMsg: import('../store/message-store').ChatMessage = {
            id: uuid(),
            peerId: from,
            fromSelf: false,
            text,
            timestamp: payload.timestamp,
            signatureValid: true,
            crypto: {
              ciphertextSize: ciphertext.length,
              signatureSize: signature.length,
              verifyTimeMs,
              decryptTimeMs,
            },
          };

          if (isFile) {
            chatMsg.file = {
              name: payload.fileName ?? 'file',
              type: payload.fileType ?? 'application/octet-stream',
              size: payload.fileSize ?? decryptedBytes.length,
              data: decryptedBytes,
            };
          }

          useMessageStore.getState().addMessage(from, chatMsg);
          break;
        }
      }
      break;
    }

    case 'error':
      console.error('Server error:', msg.message);
      break;
  }
}

export function useWebSocket() {
  const clientRef = useRef<WsClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  const identity = useIdentityStore((s) => s.identity);
  const serverUrl = getServerUrl();

  useEffect(() => {
    if (!identity) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setConnectionState('disconnected');
      return;
    }

    let disposed = false;

    const client = new WsClient(
      serverUrl,
      (msg) => { if (!disposed) onServerMessage(msg, clientRef); },
      (state) => { if (!disposed) setConnectionState(state); },
      () => {
        if (!disposed) {
          client.send({
            type: 'register',
            peerId: identity.nickname,
            mlDsaPublicKey: toBase64(identity.dsa.publicKey),
          });
        }
      },
    );
    clientRef.current = client;
    client.connect();

    return () => {
      disposed = true;
      client.disconnect();
    };
  }, [identity, serverUrl]);

  const initiateKeyExchange = useCallback((peerId: string) => {
    const id = useIdentityStore.getState().identity;
    if (!id || !clientRef.current) return;

    useSessionStore.getState().initSession(peerId, id.kem.secretKey);

    clientRef.current.send({
      type: 'relay',
      to: peerId,
      payload: {
        kind: 'ke-init',
        mlKemPublicKey: toBase64(id.kem.publicKey),
        mlDsaPublicKey: toBase64(id.dsa.publicKey),
      },
    });
  }, []);

  const sendEncryptedMessage = useCallback(async (peerId: string, text: string) => {
    const id = useIdentityStore.getState().identity;
    const sess = useSessionStore.getState().getSession(peerId);
    if (!id || !sess?.sharedSecret || !clientRef.current) return;

    const timestamp = Date.now();

    // Encrypt
    const encryptStart = performance.now();
    const ciphertext = encryptString(sess.sharedSecret, text);
    const encryptTimeMs = performance.now() - encryptStart;

    // FIX 3: Sign the full envelope (ciphertext + metadata)
    const envelope = buildSignedEnvelope(ciphertext, 'text', timestamp);
    const signStart = performance.now();
    const signature = await signMessage(id.dsa.secretKey, envelope);
    const signTimeMs = performance.now() - signStart;

    clientRef.current.send({
      type: 'relay',
      to: peerId,
      payload: {
        kind: 'chat',
        messageType: 'text',
        ciphertext: toBase64(ciphertext),
        signature: toBase64(signature),
        timestamp,
      },
    });

    useMessageStore.getState().addMessage(peerId, {
      id: uuid(),
      peerId,
      fromSelf: true,
      text,
      timestamp,
      signatureValid: true,
      crypto: {
        ciphertextSize: ciphertext.length,
        signatureSize: signature.length,
        encryptTimeMs,
        signTimeMs,
      },
    });
  }, []);

  const sendFile = useCallback(async (peerId: string, file: File) => {
    const id = useIdentityStore.getState().identity;
    const sess = useSessionStore.getState().getSession(peerId);
    if (!id || !sess?.sharedSecret || !clientRef.current) return;

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const timestamp = Date.now();

    // Encrypt
    const encryptStart = performance.now();
    const ciphertext = encrypt(sess.sharedSecret, fileBytes);
    const encryptTimeMs = performance.now() - encryptStart;

    // FIX 3: Sign the full envelope (ciphertext + file metadata)
    const envelope = buildSignedEnvelope(ciphertext, 'file', timestamp, file.name, file.type);
    const signStart = performance.now();
    const signature = await signMessage(id.dsa.secretKey, envelope);
    const signTimeMs = performance.now() - signStart;

    clientRef.current.send({
      type: 'relay',
      to: peerId,
      payload: {
        kind: 'chat',
        messageType: 'file',
        ciphertext: toBase64(ciphertext),
        signature: toBase64(signature),
        timestamp,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    });

    useMessageStore.getState().addMessage(peerId, {
      id: uuid(),
      peerId,
      fromSelf: true,
      text: file.name,
      timestamp,
      signatureValid: true,
      crypto: {
        ciphertextSize: ciphertext.length,
        signatureSize: signature.length,
        encryptTimeMs,
        signTimeMs,
      },
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        data: fileBytes,
      },
    });
  }, []);

  return {
    connectionState,
    initiateKeyExchange,
    sendEncryptedMessage,
    sendFile,
  };
}
