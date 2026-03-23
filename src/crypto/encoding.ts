/** Encode Uint8Array to base64 string for JSON transport. */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decode base64 string back to Uint8Array. */
export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encode a string to UTF-8 Uint8Array. */
export function toBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Decode UTF-8 Uint8Array to string. */
export function fromBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/** Get a short hex fingerprint of a public key (first 8 bytes). */
export function fingerprint(key: Uint8Array): string {
  return Array.from(key.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
