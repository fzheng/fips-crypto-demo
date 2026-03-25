import { describe, it, expect } from 'vitest';
import { nextStatus, type SessionStatus } from '../../src/protocol/session';

describe('session state machine — extended', () => {
  it('initiate always goes to ke-initiated regardless of current state', () => {
    const states: SessionStatus[] = ['none', 'ke-initiated', 'ke-responded', 'established'];
    for (const state of states) {
      expect(nextStatus(state, 'initiate')).toBe('ke-initiated');
    }
  });

  it('respond always goes to established regardless of current state', () => {
    const states: SessionStatus[] = ['none', 'ke-initiated', 'ke-responded', 'established'];
    for (const state of states) {
      expect(nextStatus(state, 'respond')).toBe('established');
    }
  });

  it('complete from ke-responded stays ke-responded', () => {
    expect(nextStatus('ke-responded', 'complete')).toBe('ke-responded');
  });

  it('complete is idempotent on established', () => {
    expect(nextStatus('established', 'complete')).toBe('established');
    expect(nextStatus('established', 'complete')).toBe('established');
  });

  it('complete from none stays none (no pending)', () => {
    expect(nextStatus('none', 'complete')).toBe('none');
  });

  it('full initiator flow: none → ke-initiated → established', () => {
    let state: SessionStatus = 'none';
    state = nextStatus(state, 'initiate');
    expect(state).toBe('ke-initiated');
    state = nextStatus(state, 'complete');
    expect(state).toBe('established');
  });

  it('full responder flow: none → established (single step)', () => {
    let state: SessionStatus = 'none';
    state = nextStatus(state, 'respond');
    expect(state).toBe('established');
  });

  it('re-initiate from established resets to ke-initiated', () => {
    let state: SessionStatus = 'established';
    state = nextStatus(state, 'initiate');
    expect(state).toBe('ke-initiated');
  });

  it('handles unknown event gracefully (returns current state)', () => {
    // TypeScript would catch this, but test runtime behavior
    const result = nextStatus('established', 'unknown' as any);
    expect(result).toBe('established');
  });
});
