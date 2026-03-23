import { toBytes } from './encoding';

/**
 * Build a canonical byte string for signing that covers both
 * ciphertext and message metadata. This prevents the relay
 * from rewriting timestamps, filenames, or MIME types without
 * breaking the signature.
 *
 * Format: "pqc-envelope-v1" || messageType || timestamp (8 BE bytes)
 *         || ciphertext || fileName || fileType
 */
export function buildSignedEnvelope(
  ciphertext: Uint8Array,
  messageType: 'text' | 'file',
  timestamp: number,
  fileName?: string,
  fileType?: string,
): Uint8Array {
  const prefix = toBytes('pqc-envelope-v1');
  const typeByte = toBytes(messageType);
  const tsBytes = new Uint8Array(8);
  const view = new DataView(tsBytes.buffer);
  view.setFloat64(0, timestamp, false); // big-endian
  const nameBytes = fileName ? toBytes(fileName) : new Uint8Array(0);
  const mimeBytes = fileType ? toBytes(fileType) : new Uint8Array(0);

  const total = prefix.length + typeByte.length + 8 + ciphertext.length + nameBytes.length + mimeBytes.length;
  const envelope = new Uint8Array(total);
  let offset = 0;
  envelope.set(prefix, offset); offset += prefix.length;
  envelope.set(typeByte, offset); offset += typeByte.length;
  envelope.set(tsBytes, offset); offset += 8;
  envelope.set(ciphertext, offset); offset += ciphertext.length;
  envelope.set(nameBytes, offset); offset += nameBytes.length;
  envelope.set(mimeBytes, offset);

  return envelope;
}
