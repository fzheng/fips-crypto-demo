// ---- Client → Server ----

export interface RegisterMessage {
  type: 'register';
  peerId: string;
  mlDsaPublicKey: string; // base64
}

export interface ListPeersMessage {
  type: 'list-peers';
}

export interface RelayMessage {
  type: 'relay';
  to: string;
  payload: PeerPayload;
}

export type ClientMessage = RegisterMessage | ListPeersMessage | RelayMessage;

// ---- Server → Client ----

export interface RegisteredMessage {
  type: 'registered';
  peerId: string;
}

export interface PeerListMessage {
  type: 'peer-list';
  peers: Array<{ peerId: string; mlDsaPublicKey: string }>;
}

export interface PeerJoinedMessage {
  type: 'peer-joined';
  peerId: string;
  mlDsaPublicKey: string;
}

export interface PeerLeftMessage {
  type: 'peer-left';
  peerId: string;
}

export interface RelayedMessage {
  type: 'relayed';
  from: string;
  payload: PeerPayload;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type ServerMessage =
  | RegisteredMessage
  | PeerListMessage
  | PeerJoinedMessage
  | PeerLeftMessage
  | RelayedMessage
  | ErrorMessage;

// ---- Peer Payloads (inside relay/relayed) ----

export interface KeyExchangeInitPayload {
  kind: 'ke-init';
  mlKemPublicKey: string;  // base64
  mlDsaPublicKey: string;  // base64
}

export interface KeyExchangeResponsePayload {
  kind: 'ke-response';
  mlKemCiphertext: string; // base64
  mlDsaPublicKey: string;  // base64
}

export interface EncryptedChatPayload {
  kind: 'chat';
  messageType: 'text' | 'file';
  ciphertext: string;  // base64
  signature: string;   // base64
  timestamp: number;
  // File metadata (plaintext — content is encrypted)
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export type PeerPayload =
  | KeyExchangeInitPayload
  | KeyExchangeResponsePayload
  | EncryptedChatPayload;
