import { describe, it, expect } from 'vitest';
import { nextStatus } from '../../src/protocol/session';

describe('session state machine', () => {
  it('initiate: none → ke-initiated', () => {
    expect(nextStatus('none', 'initiate')).toBe('ke-initiated');
  });

  it('respond: any → established (responder derives key immediately)', () => {
    expect(nextStatus('none', 'respond')).toBe('established');
    expect(nextStatus('ke-initiated', 'respond')).toBe('established');
  });

  it('complete: ke-initiated → established', () => {
    expect(nextStatus('ke-initiated', 'complete')).toBe('established');
  });

  it('complete: none stays none (no pending exchange)', () => {
    expect(nextStatus('none', 'complete')).toBe('none');
  });

  it('complete: established stays established', () => {
    expect(nextStatus('established', 'complete')).toBe('established');
  });
});
