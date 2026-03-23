import { WebSocketServer, WebSocket } from 'ws';

interface ConnectedClient {
  ws: WebSocket;
  peerId: string;
  mlDsaPublicKey: string;
}

const PORT = Number(process.env.PORT) || 3001;
const MAX_MESSAGE_BYTES = 8 * 1024 * 1024; // 8 MB — reject anything larger

const wss = new WebSocketServer({
  host: '0.0.0.0',
  port: PORT,
  maxPayload: MAX_MESSAGE_BYTES,
});

const clients = new Map<string, ConnectedClient>();

function broadcast(message: object, exclude?: string) {
  const data = JSON.stringify(message);
  for (const [id, client] of clients) {
    if (id !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

function send(ws: WebSocket, message: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  let registeredId: string | null = null;

  ws.on('message', (raw) => {
    // Server-side size check (belt-and-suspenders with maxPayload)
    const rawStr = raw.toString();
    if (rawStr.length > MAX_MESSAGE_BYTES) {
      send(ws, { type: 'error', message: 'Message too large' });
      return;
    }

    let msg: any;
    try {
      msg = JSON.parse(rawStr);
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    switch (msg.type) {
      case 'register': {
        const { peerId, mlDsaPublicKey } = msg;
        if (!peerId || !mlDsaPublicKey) {
          send(ws, { type: 'error', message: 'Missing peerId or mlDsaPublicKey' });
          return;
        }
        if (clients.has(peerId)) {
          const existing = clients.get(peerId)!;
          if (existing.ws !== ws) {
            existing.ws.close();
          }
        }

        registeredId = peerId;
        clients.set(peerId, { ws, peerId, mlDsaPublicKey });

        send(ws, { type: 'registered', peerId });

        const peers = Array.from(clients.values())
          .filter((c) => c.peerId !== peerId)
          .map((c) => ({ peerId: c.peerId, mlDsaPublicKey: c.mlDsaPublicKey }));
        send(ws, { type: 'peer-list', peers });

        broadcast({ type: 'peer-joined', peerId, mlDsaPublicKey }, peerId);

        console.log(`[+] ${peerId} registered (${clients.size} online)`);
        break;
      }

      case 'list-peers': {
        const peers = Array.from(clients.values())
          .filter((c) => c.peerId !== registeredId)
          .map((c) => ({ peerId: c.peerId, mlDsaPublicKey: c.mlDsaPublicKey }));
        send(ws, { type: 'peer-list', peers });
        break;
      }

      case 'relay': {
        if (!registeredId) {
          send(ws, { type: 'error', message: 'Must register before relaying' });
          return;
        }
        const target = clients.get(msg.to);
        if (!target) {
          send(ws, { type: 'error', message: `Peer "${msg.to}" not found` });
          return;
        }
        send(target.ws, {
          type: 'relayed',
          from: registeredId,
          payload: msg.payload,
        });
        break;
      }

      default:
        send(ws, { type: 'error', message: `Unknown message type: ${msg.type}` });
    }
  });

  ws.on('close', () => {
    if (registeredId) {
      clients.delete(registeredId);
      broadcast({ type: 'peer-left', peerId: registeredId });
      console.log(`[-] ${registeredId} disconnected (${clients.size} online)`);
    }
  });
});

console.log(`PQC Demo relay server listening on ws://localhost:${PORT}`);
