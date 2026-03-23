import { describe, it, expect, beforeEach } from 'vitest';
import { usePeerStore } from '../../src/store/peer-store';
import { useSessionStore } from '../../src/store/session-store';
import { useMessageStore } from '../../src/store/message-store';
import { useBenchmarkStore } from '../../src/store/benchmark-store';
import { useSettingsStore } from '../../src/store/settings-store';

describe('peer store', () => {
  beforeEach(() => {
    usePeerStore.setState({ peers: new Map(), activePeerId: null });
  });

  it('adds and removes peers', () => {
    const { addPeer, removePeer } = usePeerStore.getState();

    addPeer({ peerId: 'alice', mlDsaPublicKey: 'key-a' });
    addPeer({ peerId: 'bob', mlDsaPublicKey: 'key-b' });

    expect(usePeerStore.getState().peers.size).toBe(2);

    removePeer('alice');
    expect(usePeerStore.getState().peers.size).toBe(1);
    expect(usePeerStore.getState().peers.has('bob')).toBe(true);
  });

  it('sets peer list from array', () => {
    usePeerStore.getState().setPeers([
      { peerId: 'a', mlDsaPublicKey: 'k1' },
      { peerId: 'b', mlDsaPublicKey: 'k2' },
    ]);
    expect(usePeerStore.getState().peers.size).toBe(2);
  });

  it('clears activePeerId when that peer is removed', () => {
    const store = usePeerStore.getState();
    store.addPeer({ peerId: 'alice', mlDsaPublicKey: 'k' });
    store.setActivePeer('alice');
    expect(usePeerStore.getState().activePeerId).toBe('alice');

    usePeerStore.getState().removePeer('alice');
    expect(usePeerStore.getState().activePeerId).toBeNull();
  });
});

describe('session store', () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: new Map() });
  });

  it('initializes a session with pending KEM key', () => {
    const kemKey = new Uint8Array(32).fill(1);
    useSessionStore.getState().initSession('bob', kemKey);

    const session = useSessionStore.getState().getSession('bob');
    expect(session).toBeDefined();
    expect(session!.status).toBe('ke-initiated');
    expect(session!.pendingKemSecretKey).toEqual(kemKey);
    expect(session!.sharedSecret).toBeNull();
  });

  it('establishes a session', () => {
    const sharedSecret = new Uint8Array(32).fill(0xab);
    const dsaPub = new Uint8Array(1952).fill(0xcd);

    useSessionStore.getState().initSession('bob', new Uint8Array(32));
    useSessionStore.getState().establishSession('bob', sharedSecret, dsaPub);

    const session = useSessionStore.getState().getSession('bob');
    expect(session!.status).toBe('established');
    expect(session!.sharedSecret).toEqual(sharedSecret);
    expect(session!.peerDsaPublicKey).toEqual(dsaPub);
  });

  it('removes a session', () => {
    useSessionStore.getState().initSession('bob', new Uint8Array(32));
    useSessionStore.getState().removeSession('bob');
    expect(useSessionStore.getState().getSession('bob')).toBeUndefined();
  });
});

describe('message store', () => {
  beforeEach(() => {
    useMessageStore.setState({ messages: new Map() });
  });

  it('adds messages per peer', () => {
    const msg1 = {
      id: '1', peerId: 'alice', fromSelf: true, text: 'hi',
      timestamp: Date.now(), signatureValid: true,
    };
    const msg2 = {
      id: '2', peerId: 'alice', fromSelf: false, text: 'hello',
      timestamp: Date.now(), signatureValid: true,
    };
    const msg3 = {
      id: '3', peerId: 'bob', fromSelf: true, text: 'hey bob',
      timestamp: Date.now(), signatureValid: true,
    };

    useMessageStore.getState().addMessage('alice', msg1);
    useMessageStore.getState().addMessage('alice', msg2);
    useMessageStore.getState().addMessage('bob', msg3);

    expect(useMessageStore.getState().getMessages('alice')).toHaveLength(2);
    expect(useMessageStore.getState().getMessages('bob')).toHaveLength(1);
    expect(useMessageStore.getState().getMessages('nobody')).toHaveLength(0);
  });
});

describe('benchmark store', () => {
  beforeEach(() => {
    useBenchmarkStore.getState().clear();
  });

  it('adds results and tracks running state', () => {
    const store = useBenchmarkStore.getState();
    store.setRunning(true);
    expect(useBenchmarkStore.getState().isRunning).toBe(true);

    store.addResult({
      algorithm: 'ML-KEM-768',
      operation: 'keygen',
      library: 'fips-crypto',
      iterations: 100,
      totalMs: 50,
      avgMs: 0.5,
      opsPerSec: 2000,
    });

    expect(useBenchmarkStore.getState().results).toHaveLength(1);

    store.setProgress(50);
    expect(useBenchmarkStore.getState().progress).toBe(50);

    store.clear();
    expect(useBenchmarkStore.getState().results).toHaveLength(0);
    expect(useBenchmarkStore.getState().progress).toBe(0);
  });
});

describe('settings store', () => {
  it('has correct defaults', () => {
    const { serverUrl, activeTab } = useSettingsStore.getState();
    expect(serverUrl).toBe('ws://localhost:3001');
    expect(activeTab).toBe('chat');
  });

  it('switches active tab', () => {
    useSettingsStore.getState().setActiveTab('benchmark');
    expect(useSettingsStore.getState().activeTab).toBe('benchmark');

    useSettingsStore.getState().setActiveTab('how-it-works');
    expect(useSettingsStore.getState().activeTab).toBe('how-it-works');
  });
});
