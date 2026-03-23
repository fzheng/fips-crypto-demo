import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;
let port: number;
let portCounter = 4200;

function startServer(p: number): Promise<void> {
  return new Promise((resolve) => {
    const clients = new Map<string, { ws: WebSocket; peerId: string; mlDsaPublicKey: string }>();

    function broadcast(message: object, exclude?: string) {
      const data = JSON.stringify(message);
      for (const [, client] of clients) {
        if (client.peerId !== exclude && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(data);
        }
      }
    }
    function send(ws: WebSocket, message: object) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
    }

    wss = new WebSocketServer({ port: p }, resolve);

    wss.on('connection', (ws) => {
      let registeredId: string | null = null;
      ws.on('message', (raw) => {
        let msg: any;
        try { msg = JSON.parse(raw.toString()); } catch { return; }
        switch (msg.type) {
          case 'register': {
            const { peerId, mlDsaPublicKey } = msg;
            if (!peerId || !mlDsaPublicKey) { send(ws, { type: 'error', message: 'Missing fields' }); return; }
            if (clients.has(peerId)) { const e = clients.get(peerId)!; if (e.ws !== ws) e.ws.close(); }
            registeredId = peerId;
            clients.set(peerId, { ws, peerId, mlDsaPublicKey });
            send(ws, { type: 'registered', peerId });
            send(ws, { type: 'peer-list', peers: Array.from(clients.values()).filter(c => c.peerId !== peerId).map(c => ({ peerId: c.peerId, mlDsaPublicKey: c.mlDsaPublicKey })) });
            broadcast({ type: 'peer-joined', peerId, mlDsaPublicKey }, peerId);
            break;
          }
          case 'relay': {
            if (!registeredId) { send(ws, { type: 'error', message: 'Must register before relaying' }); return; }
            const target = clients.get(msg.to);
            if (!target) { send(ws, { type: 'error', message: `Peer "${msg.to}" not found` }); return; }
            send(target.ws, { type: 'relayed', from: registeredId, payload: msg.payload });
            break;
          }
        }
      });
      ws.on('close', () => {
        if (registeredId) { clients.delete(registeredId); broadcast({ type: 'peer-left', peerId: registeredId }); }
      });
    });
  });
}

/** Client wrapper with a message queue — no lost events. */
class TestClient {
  ws!: WebSocket;
  private queue: any[] = [];
  private waiters: ((msg: any) => void)[] = [];

  async connect(p: number) {
    this.ws = await new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${p}`);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });
    this.ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (this.waiters.length > 0) {
        this.waiters.shift()!(msg);
      } else {
        this.queue.push(msg);
      }
    });
  }

  /** Get the next message — returns immediately if one is already queued. */
  next(timeoutMs = 3000): Promise<any> {
    if (this.queue.length > 0) {
      return Promise.resolve(this.queue.shift());
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      this.waiters.push((msg) => { clearTimeout(timer); resolve(msg); });
    });
  }

  send(msg: object) { this.ws.send(JSON.stringify(msg)); }
  close() { this.ws.close(); }
}

const clients: TestClient[] = [];

async function makeClient(): Promise<TestClient> {
  const c = new TestClient();
  await c.connect(port);
  clients.push(c);
  return c;
}

beforeEach(async () => {
  port = portCounter++;
  await startServer(port);
});

afterEach(async () => {
  for (const c of clients) c.close();
  clients.length = 0;
  await new Promise<void>((r) => wss.close(() => r()));
});

describe('WebSocket relay server', () => {
  it('registers a client and confirms', async () => {
    const c = await makeClient();
    c.send({ type: 'register', peerId: 'test1', mlDsaPublicKey: 'abc' });
    const msg = await c.next();
    expect(msg.type).toBe('registered');
    expect(msg.peerId).toBe('test1');
  });

  it('sends peer list after registration', async () => {
    const c1 = await makeClient();
    c1.send({ type: 'register', peerId: 'a', mlDsaPublicKey: 'ka' });
    await c1.next(); // registered
    await c1.next(); // peer-list (empty)

    const c2 = await makeClient();
    c2.send({ type: 'register', peerId: 'b', mlDsaPublicKey: 'kb' });
    await c2.next(); // registered
    const peerList = await c2.next();
    expect(peerList.type).toBe('peer-list');
    expect(peerList.peers).toContainEqual({ peerId: 'a', mlDsaPublicKey: 'ka' });
  });

  it('notifies when a peer joins', async () => {
    const c1 = await makeClient();
    c1.send({ type: 'register', peerId: 'first', mlDsaPublicKey: 'k1' });
    await c1.next(); // registered
    await c1.next(); // peer-list

    const c2 = await makeClient();
    c2.send({ type: 'register', peerId: 'second', mlDsaPublicKey: 'k2' });

    const join = await c1.next();
    expect(join.type).toBe('peer-joined');
    expect(join.peerId).toBe('second');
  });

  it('notifies when a peer leaves', async () => {
    const c1 = await makeClient();
    c1.send({ type: 'register', peerId: 'stayer', mlDsaPublicKey: 'k1' });
    await c1.next(); await c1.next(); // registered + peer-list

    const c2 = await makeClient();
    c2.send({ type: 'register', peerId: 'leaver', mlDsaPublicKey: 'k2' });
    await c1.next(); // peer-joined

    clients.splice(clients.indexOf(c2), 1);
    c2.close();

    const left = await c1.next();
    expect(left.type).toBe('peer-left');
    expect(left.peerId).toBe('leaver');
  });

  it('relays messages between peers', async () => {
    const c1 = await makeClient();
    c1.send({ type: 'register', peerId: 'sender', mlDsaPublicKey: 'k1' });
    await c1.next(); await c1.next();

    const c2 = await makeClient();
    c2.send({ type: 'register', peerId: 'receiver', mlDsaPublicKey: 'k2' });
    await c2.next(); await c2.next();
    await c1.next(); // peer-joined

    const payload = { kind: 'chat', ciphertext: 'abc', signature: 'def', timestamp: 123 };
    c1.send({ type: 'relay', to: 'receiver', payload });

    const relayed = await c2.next();
    expect(relayed.type).toBe('relayed');
    expect(relayed.from).toBe('sender');
    expect(relayed.payload).toEqual(payload);
  });

  it('returns error for relay to non-existent peer', async () => {
    const c = await makeClient();
    c.send({ type: 'register', peerId: 'lonely', mlDsaPublicKey: 'k1' });
    await c.next(); await c.next();

    c.send({ type: 'relay', to: 'nobody', payload: {} });
    const err = await c.next();
    expect(err.type).toBe('error');
    expect(err.message).toContain('nobody');
  });

  it('returns error for unregistered relay attempt', async () => {
    const c = await makeClient();
    c.send({ type: 'relay', to: 'someone', payload: {} });
    const err = await c.next();
    expect(err.type).toBe('error');
    expect(err.message).toContain('register');
  });
});
