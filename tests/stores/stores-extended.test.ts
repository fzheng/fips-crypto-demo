import { describe, it, expect, beforeEach } from 'vitest';
import { usePeerStore } from '../../src/store/peer-store';
import { useSessionStore } from '../../src/store/session-store';
import { useMessageStore } from '../../src/store/message-store';
import { useBenchmarkStore } from '../../src/store/benchmark-store';
import { useSettingsStore } from '../../src/store/settings-store';

describe('peer store — extended', () => {
  beforeEach(() => {
    usePeerStore.setState({ peers: new Map(), activePeerId: null });
  });

  it('setActivePeer sets and gets correctly', () => {
    usePeerStore.getState().addPeer({ peerId: 'alice', mlDsaPublicKey: 'ka' });
    usePeerStore.getState().setActivePeer('alice');
    expect(usePeerStore.getState().activePeerId).toBe('alice');
  });

  it('setActivePeer to null clears selection', () => {
    usePeerStore.getState().setActivePeer('alice');
    usePeerStore.getState().setActivePeer(null);
    expect(usePeerStore.getState().activePeerId).toBeNull();
  });

  it('adding duplicate peerId overwrites the entry', () => {
    usePeerStore.getState().addPeer({ peerId: 'alice', mlDsaPublicKey: 'key1' });
    usePeerStore.getState().addPeer({ peerId: 'alice', mlDsaPublicKey: 'key2' });
    expect(usePeerStore.getState().peers.size).toBe(1);
    expect(usePeerStore.getState().peers.get('alice')!.mlDsaPublicKey).toBe('key2');
  });

  it('removing non-existent peer does nothing', () => {
    usePeerStore.getState().addPeer({ peerId: 'alice', mlDsaPublicKey: 'k' });
    usePeerStore.getState().removePeer('nobody');
    expect(usePeerStore.getState().peers.size).toBe(1);
  });

  it('removing peer does not affect activePeerId if different peer is active', () => {
    usePeerStore.getState().addPeer({ peerId: 'alice', mlDsaPublicKey: 'ka' });
    usePeerStore.getState().addPeer({ peerId: 'bob', mlDsaPublicKey: 'kb' });
    usePeerStore.getState().setActivePeer('bob');
    usePeerStore.getState().removePeer('alice');
    expect(usePeerStore.getState().activePeerId).toBe('bob');
  });

  it('setPeers replaces all peers', () => {
    usePeerStore.getState().addPeer({ peerId: 'old', mlDsaPublicKey: 'k' });
    usePeerStore.getState().setPeers([
      { peerId: 'new1', mlDsaPublicKey: 'k1' },
      { peerId: 'new2', mlDsaPublicKey: 'k2' },
    ]);
    expect(usePeerStore.getState().peers.has('old')).toBe(false);
    expect(usePeerStore.getState().peers.size).toBe(2);
  });

  it('setPeers with empty array clears all', () => {
    usePeerStore.getState().addPeer({ peerId: 'alice', mlDsaPublicKey: 'k' });
    usePeerStore.getState().setPeers([]);
    expect(usePeerStore.getState().peers.size).toBe(0);
  });
});

describe('session store — extended', () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: new Map() });
  });

  it('getSession returns undefined for unknown peer', () => {
    expect(useSessionStore.getState().getSession('unknown')).toBeUndefined();
  });

  it('initSession overwrites existing session', () => {
    const key1 = new Uint8Array(32).fill(1);
    const key2 = new Uint8Array(32).fill(2);
    useSessionStore.getState().initSession('bob', key1);
    useSessionStore.getState().initSession('bob', key2);
    expect(useSessionStore.getState().getSession('bob')!.pendingKemSecretKey).toEqual(key2);
  });

  it('establishSession sets timestamp', () => {
    const before = Date.now();
    useSessionStore.getState().initSession('bob', new Uint8Array(32));
    useSessionStore.getState().establishSession(
      'bob',
      new Uint8Array(32).fill(0xab),
      new Uint8Array(1952).fill(0xcd),
    );
    const session = useSessionStore.getState().getSession('bob')!;
    expect(session.establishedAt).toBeGreaterThanOrEqual(before);
    expect(session.establishedAt).toBeLessThanOrEqual(Date.now());
  });

  it('multiple sessions for different peers are independent', () => {
    const key1 = new Uint8Array(32).fill(1);
    const key2 = new Uint8Array(32).fill(2);
    useSessionStore.getState().initSession('alice', key1);
    useSessionStore.getState().initSession('bob', key2);

    useSessionStore.getState().establishSession('alice', new Uint8Array(32).fill(0xaa), new Uint8Array(1952));

    expect(useSessionStore.getState().getSession('alice')!.status).toBe('established');
    expect(useSessionStore.getState().getSession('bob')!.status).toBe('ke-initiated');
  });

  it('removeSession for unknown peer is a no-op', () => {
    useSessionStore.getState().initSession('alice', new Uint8Array(32));
    useSessionStore.getState().removeSession('unknown');
    expect(useSessionStore.getState().getSession('alice')).toBeDefined();
  });

  it('established session clears pendingKemSecretKey', () => {
    useSessionStore.getState().initSession('bob', new Uint8Array(32).fill(1));
    useSessionStore.getState().establishSession(
      'bob',
      new Uint8Array(32).fill(0xab),
      new Uint8Array(1952),
    );
    const session = useSessionStore.getState().getSession('bob')!;
    expect(session.pendingKemSecretKey).toBeUndefined();
  });
});

describe('message store — extended', () => {
  beforeEach(() => {
    useMessageStore.setState({ messages: new Map() });
  });

  it('getMessages returns stable empty array for unknown peer', () => {
    const msgs1 = useMessageStore.getState().getMessages('nobody');
    const msgs2 = useMessageStore.getState().getMessages('nobody');
    expect(msgs1).toHaveLength(0);
    // Should be the same reference (EMPTY_MESSAGES constant)
    expect(msgs1).toBe(msgs2);
  });

  it('messages are ordered by insertion', () => {
    const store = useMessageStore.getState();
    store.addMessage('alice', {
      id: '1', peerId: 'alice', fromSelf: true, text: 'first',
      timestamp: 1000, signatureValid: true,
    });
    store.addMessage('alice', {
      id: '2', peerId: 'alice', fromSelf: false, text: 'second',
      timestamp: 2000, signatureValid: true,
    });
    store.addMessage('alice', {
      id: '3', peerId: 'alice', fromSelf: true, text: 'third',
      timestamp: 3000, signatureValid: true,
    });
    const msgs = useMessageStore.getState().getMessages('alice');
    expect(msgs.map((m) => m.text)).toEqual(['first', 'second', 'third']);
  });

  it('messages with file attachment are stored correctly', () => {
    useMessageStore.getState().addMessage('alice', {
      id: '1', peerId: 'alice', fromSelf: false, text: '',
      timestamp: Date.now(), signatureValid: true,
      file: { name: 'photo.png', type: 'image/png', size: 5000, data: new Uint8Array(5000) },
    });
    const msgs = useMessageStore.getState().getMessages('alice');
    expect(msgs[0].file).toBeDefined();
    expect(msgs[0].file!.name).toBe('photo.png');
    expect(msgs[0].file!.size).toBe(5000);
  });

  it('messages with crypto detail are stored correctly', () => {
    useMessageStore.getState().addMessage('alice', {
      id: '1', peerId: 'alice', fromSelf: true, text: 'hi',
      timestamp: Date.now(), signatureValid: true,
      crypto: { ciphertextSize: 100, signatureSize: 3309, encryptTimeMs: 0.5, signTimeMs: 2.1 },
    });
    const msgs = useMessageStore.getState().getMessages('alice');
    expect(msgs[0].crypto!.ciphertextSize).toBe(100);
    expect(msgs[0].crypto!.signTimeMs).toBe(2.1);
  });

  it('invalid signature messages are stored with signatureValid=false', () => {
    useMessageStore.getState().addMessage('alice', {
      id: '1', peerId: 'alice', fromSelf: false, text: '[Message rejected: invalid signature]',
      timestamp: Date.now(), signatureValid: false,
    });
    const msgs = useMessageStore.getState().getMessages('alice');
    expect(msgs[0].signatureValid).toBe(false);
  });
});

describe('benchmark store — extended', () => {
  beforeEach(() => {
    useBenchmarkStore.getState().clear();
  });

  it('starts with empty results and not running', () => {
    const state = useBenchmarkStore.getState();
    expect(state.results).toHaveLength(0);
    expect(state.isRunning).toBe(false);
    expect(state.progress).toBe(0);
  });

  it('accumulates multiple results', () => {
    const store = useBenchmarkStore.getState();
    for (let i = 0; i < 10; i++) {
      store.addResult({
        algorithm: `alg-${i}`,
        operation: 'keygen',
        library: i % 2 === 0 ? 'fips-crypto' : 'pure-js',
        iterations: 100,
        totalMs: 50,
        avgMs: 0.5,
        opsPerSec: 2000,
      });
    }
    expect(useBenchmarkStore.getState().results).toHaveLength(10);
  });

  it('clear resets results and progress but not running state', () => {
    const store = useBenchmarkStore.getState();
    store.setRunning(true);
    store.setProgress(75);
    store.addResult({
      algorithm: 'test', operation: 'keygen', library: 'fips-crypto',
      iterations: 10, totalMs: 5, avgMs: 0.5, opsPerSec: 2000,
    });
    store.clear();
    expect(useBenchmarkStore.getState().results).toHaveLength(0);
    expect(useBenchmarkStore.getState().progress).toBe(0);
    // isRunning is managed separately — clear() only resets results/progress
    expect(useBenchmarkStore.getState().isRunning).toBe(true);
    store.setRunning(false);
  });

  it('progress can be set to 0 and 100', () => {
    useBenchmarkStore.getState().setProgress(0);
    expect(useBenchmarkStore.getState().progress).toBe(0);
    useBenchmarkStore.getState().setProgress(100);
    expect(useBenchmarkStore.getState().progress).toBe(100);
  });
});

describe('settings store — extended', () => {
  it('setActiveTab cycles through all tabs', () => {
    const tabs = ['chat', 'benchmark', 'how-it-works'] as const;
    for (const tab of tabs) {
      useSettingsStore.getState().setActiveTab(tab);
      expect(useSettingsStore.getState().activeTab).toBe(tab);
    }
  });
});
