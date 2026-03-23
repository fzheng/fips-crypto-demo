import { describe, it, expect } from 'vitest';
import { buildSignedEnvelope } from '../../src/crypto/envelope';

describe('buildSignedEnvelope', () => {
  const ct = new Uint8Array([1, 2, 3]);

  it('produces deterministic output for the same inputs', () => {
    const e1 = buildSignedEnvelope(ct, 'text', 1000);
    const e2 = buildSignedEnvelope(ct, 'text', 1000);
    expect(e1).toEqual(e2);
  });

  it('changes when timestamp changes', () => {
    const e1 = buildSignedEnvelope(ct, 'text', 1000);
    const e2 = buildSignedEnvelope(ct, 'text', 2000);
    expect(e1).not.toEqual(e2);
  });

  it('changes when messageType changes', () => {
    const e1 = buildSignedEnvelope(ct, 'text', 1000);
    const e2 = buildSignedEnvelope(ct, 'file', 1000);
    expect(e1).not.toEqual(e2);
  });

  it('changes when ciphertext changes', () => {
    const e1 = buildSignedEnvelope(new Uint8Array([1]), 'text', 1000);
    const e2 = buildSignedEnvelope(new Uint8Array([2]), 'text', 1000);
    expect(e1).not.toEqual(e2);
  });

  it('changes when fileName changes', () => {
    const e1 = buildSignedEnvelope(ct, 'file', 1000, 'a.png');
    const e2 = buildSignedEnvelope(ct, 'file', 1000, 'b.png');
    expect(e1).not.toEqual(e2);
  });

  it('changes when fileType changes', () => {
    const e1 = buildSignedEnvelope(ct, 'file', 1000, 'a.png', 'image/png');
    const e2 = buildSignedEnvelope(ct, 'file', 1000, 'a.png', 'image/jpeg');
    expect(e1).not.toEqual(e2);
  });

  it('includes domain separation prefix', () => {
    const e = buildSignedEnvelope(ct, 'text', 0);
    const prefix = new TextDecoder().decode(e.slice(0, 15));
    expect(prefix).toBe('pqc-envelope-v1');
  });
});
