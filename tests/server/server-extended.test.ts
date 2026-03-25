import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;
let port: number;
let portCounter = 4300;

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
        const rawStr = raw.toString();
        let msg: any;
        try { msg = JSON.parse(rawStr); } catch { send(ws, { type: 'error', message: 'Invalid JSON' }); return; }
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
          case 'list-peers': {
            const peers = Array.from(clients.values())
              .filter(c => c.peerId !== registeredId)
              .map(c => ({ peerId: c.peerId, mlDsaPublicKey: c.mlDsaPublicKey }));
            send(ws, { type: 'peer-list', peers });
            break;
          }
          case 'relay': {
            if (!registeredId) { send(ws, { type: 'error', message: 'Must register before relaying' }); return; }
            const target = clients.get(msg.to);
            if (!target) { send(ws, { type: 'error', message: `Peer "${msg.to}" not found` }); return; }
            send(target.ws, { type: 'relayed', from: registeredId, payload: msg.payload });
            break;
          }
          default:
            send(ws, { type: 'error', message: `Unknown message type: ${msg.type}` });
        }
      });
      ws.on('close', () => {
        if (registeredId) { clients.delete(registeredId); broadcast({ type: 'peer-left', peerId: registeredId }); }
      });
    });
  });
}

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

  next(timeoutMs = 3000): Promise<any> {
    if (this.queue.length > 0) return Promise.resolve(this.queue.shift());
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      this.waiters.push((msg) => { clearTimeout(timer); resolve(msg); });
    });
  }

  send(msg: object) { this.ws.send(JSON.stringify(msg)); }
  sendRaw(raw: string) { this.ws.send(raw); }
  close() { this.ws.close(); }
}

const clients: TestClient[] = [];

async function makeClient(): Promise<TestClient> {
  const c = new TestClient();
  await c.connect(port);
  clients.push(c);
  return c;
}

async function registerClient(peerId: string, key = 'k'): Promise<TestClient> {
  const c = await makeClient();
  c.send({ type: 'register', peerId, mlDsaPublicKey: key });
  await c.next(); // registered
  await c.next(); // peer-list
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

describe('WebSocket relay server — extended', () => {
  it('returns error for invalid JSON', async () => {
    const c = await makeClient();
    c.sendRaw('not json');
    const err = await c.next();
    expect(err.type).toBe('error');
    expect(err.message).toContain('Invalid JSON');
  });

  it('returns error for unknown message type', async () => {
    const c = await makeClient();
    c.send({ type: 'foobar' });
    const err = await c.next();
    expect(err.type).toBe('error');
    expect(err.message).toContain('Unknown');
  });

  it('returns error for register with missing peerId', async () => {
    const c = await makeClient();
    c.send({ type: 'register', mlDsaPublicKey: 'key' });
    const err = await c.next();
    expect(err.type).toBe('error');
    expect(err.message).toContain('Missing');
  });

  it('returns error for register with missing mlDsaPublicKey', async () => {
    const c = await makeClient();
    c.send({ type: 'register', peerId: 'alice' });
    const err = await c.next();
    expect(err.type).toBe('error');
    expect(err.message).toContain('Missing');
  });

  it('handles duplicate registration by closing old connection', async () => {
    const c1 = await registerClient('alice');
    const c2 = await makeClient();
    c2.send({ type: 'register', peerId: 'alice', mlDsaPublicKey: 'newkey' });

    // c2 should get registered
    const reg = await c2.next();
    expect(reg.type).toBe('registered');

    // c1's websocket should be closed — next() should timeout
    await expect(c1.next(500)).rejects.toThrow('timeout');
  });

  it('list-peers returns current peers', async () => {
    const c1 = await registerClient('alice', 'ka');
    const c2 = await registerClient('bob', 'kb');
    // c1 gets a peer-joined for bob
    await c1.next();

    c1.send({ type: 'list-peers' });
    const list = await c1.next();
    expect(list.type).toBe('peer-list');
    expect(list.peers).toHaveLength(1);
    expect(list.peers[0].peerId).toBe('bob');
    expect(list.peers[0].mlDsaPublicKey).toBe('kb');
  });

  it('peer-list does not include self', async () => {
    await registerClient('alice');
    const c2 = await registerClient('bob');

    c2.send({ type: 'list-peers' });
    const list = await c2.next();
    expect(list.peers.every((p: any) => p.peerId !== 'bob')).toBe(true);
  });

  it('three clients can all see each other', async () => {
    const c1 = await registerClient('alice', 'ka');
    const c2 = await registerClient('bob', 'kb');
    await c1.next(); // peer-joined: bob

    const c3 = await makeClient();
    c3.send({ type: 'register', peerId: 'charlie', mlDsaPublicKey: 'kc' });
    const reg = await c3.next();
    expect(reg.type).toBe('registered');
    const list = await c3.next();
    expect(list.type).toBe('peer-list');
    expect(list.peers).toHaveLength(2);

    // alice and bob both get peer-joined for charlie
    const j1 = await c1.next();
    const j2 = await c2.next();
    expect(j1.type).toBe('peer-joined');
    expect(j1.peerId).toBe('charlie');
    expect(j2.type).toBe('peer-joined');
    expect(j2.peerId).toBe('charlie');
  });

  it('relay preserves arbitrary payload structure', async () => {
    const c1 = await registerClient('sender');
    const c2 = await registerClient('receiver');
    await c1.next(); // peer-joined

    const payload = {
      kind: 'ke-init',
      mlKemPublicKey: 'base64==',
      nested: { foo: [1, 2, 3], bar: true },
    };
    c1.send({ type: 'relay', to: 'receiver', payload });

    const msg = await c2.next();
    expect(msg.payload).toEqual(payload);
  });

  it('relay from A to B does not reach C', async () => {
    const c1 = await registerClient('a');
    const c2 = await registerClient('b');
    const c3 = await registerClient('c');
    // drain join notifications
    await c1.next(); // b joined
    await c1.next(); // c joined
    await c2.next(); // c joined

    c1.send({ type: 'relay', to: 'b', payload: { secret: true } });

    const relayed = await c2.next();
    expect(relayed.type).toBe('relayed');

    // c should not receive anything — timeout expected
    await expect(c3.next(300)).rejects.toThrow('timeout');
  });

  it('broadcast peer-left excludes the leaving peer', async () => {
    const c1 = await registerClient('stayer');
    const c2 = await registerClient('leaver');
    await c1.next(); // peer-joined

    clients.splice(clients.indexOf(c2), 1);
    c2.close();

    const left = await c1.next();
    expect(left.type).toBe('peer-left');
    expect(left.peerId).toBe('leaver');
  });

  it('unregistered client disconnect is silent (no peer-left broadcast)', async () => {
    const c1 = await registerClient('watcher');
    const c2 = await makeClient(); // connected but not registered

    clients.splice(clients.indexOf(c2), 1);
    c2.close();

    // c1 should not receive peer-left — timeout expected
    await expect(c1.next(300)).rejects.toThrow('timeout');
  });

  it('bidirectional relay works', async () => {
    const c1 = await registerClient('alice');
    const c2 = await registerClient('bob');
    await c1.next(); // peer-joined

    // alice → bob
    c1.send({ type: 'relay', to: 'bob', payload: { msg: 'hello bob' } });
    const r1 = await c2.next();
    expect(r1.from).toBe('alice');
    expect(r1.payload.msg).toBe('hello bob');

    // bob → alice
    c2.send({ type: 'relay', to: 'alice', payload: { msg: 'hello alice' } });
    const r2 = await c1.next();
    expect(r2.from).toBe('bob');
    expect(r2.payload.msg).toBe('hello alice');
  });
});
