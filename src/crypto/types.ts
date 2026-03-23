/** A user's complete identity keypairs */
export interface IdentityKeys {
  nickname: string;
  kem: {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  };
  dsa: {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  };
}

/** An established encrypted session with a peer */
export interface SessionKeys {
  sharedSecret: Uint8Array; // 32 bytes — used as XChaCha20-Poly1305 key
  peerDsaPublicKey: Uint8Array;
  establishedAt: number;
}
