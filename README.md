# PQC Messenger — Post-Quantum Encrypted Messaging Demo

A real-time encrypted messaging application powered by [fips-crypto](https://www.npmjs.com/package/fips-crypto), demonstrating post-quantum cryptography in the browser.

## Features

- **ML-KEM-768 Key Exchange** (FIPS 203) — Quantum-resistant key encapsulation to establish shared secrets between peers
- **ML-DSA-65 Signatures** (FIPS 204) — Every message and file is signed for authenticity
- **XChaCha20-Poly1305 Encryption** — Authenticated encryption for messages and files using the ML-KEM shared secret
- **End-to-End Encrypted Chat** — Text messages protected by encrypt-then-sign
- **Encrypted File & Image Sharing** — Files up to 5 MB, encrypted with the same pipeline as text
- **Performance Benchmark** — Compare fips-crypto vs pure JavaScript side-by-side in the browser
- **Educational "How It Works" Tab** — Step-by-step explanation of key generation, key exchange, encryption, and signing
- **Crypto Detail on Every Message** — Expandable view showing ciphertext size, signature size, and operation timings
- **Dark / Light Theme** — Toggle with persistent preference
- **WebSocket Relay Server** — Stateless message relay; the server never sees plaintext

## Quick Start

```bash
# Install dependencies and start everything
make dev
```

This starts:
- **Relay server** on `ws://localhost:3001`
- **Web app** on `http://localhost:5173`

Open **two browser tabs** to `http://localhost:5173`, pick different nicknames, and start chatting.

## Commands

| Command | Description |
|---------|-------------|
| `make dev` | Install deps + start relay server + dev server |
| `make build` | Type-check and build for production |
| `make test` | Run all tests |
| `make server` | Start relay server only |
| `make clean` | Remove build artifacts |

## How It Works

### Key Generation

When you enter a nickname, two keypairs are generated in your browser via fips-crypto:

| Algorithm | Standard | Public Key | Secret Key |
|-----------|----------|------------|------------|
| ML-KEM-768 | FIPS 203 | 1,184 bytes | 2,400 bytes |
| ML-DSA-65 | FIPS 204 | 1,952 bytes | 4,032 bytes |

### Key Exchange Protocol

```
Alice                                    Bob
─────                                    ───
1. Generate ML-KEM-768 keypair
2. Send KEM public key to Bob ────────>
                                         3. Encapsulate → ciphertext + shared secret
                                    <──── 4. Send ciphertext back
5. Decapsulate → same shared secret

Both now share a 32-byte symmetric key
```

### Message Flow (Encrypt-then-Sign)

**Sending:**
1. Encrypt plaintext (or file bytes) with **XChaCha20-Poly1305** using the shared key
2. Sign the ciphertext with **ML-DSA-65** using the sender's secret key

**Receiving:**
1. Verify signature with **ML-DSA-65** using the sender's public key
2. Decrypt ciphertext with **XChaCha20-Poly1305** using the shared key

The relay server only sees encrypted ciphertext and signatures — it cannot read messages or files.

## Architecture

```
src/
├── crypto/          # Crypto primitives (identity, KEM, encryption, signing)
├── protocol/        # WebSocket message types, client, session state machine
├── store/           # Zustand state (identity, peers, sessions, messages, etc.)
├── hooks/           # React hooks (useWebSocket, useKeyExchange, useBenchmark)
├── benchmark/       # Benchmark runner comparing fips-crypto vs pure JS
├── components/      # React UI components
└── App.tsx          # Root component (login screen + main app)

server/
└── server.ts        # WebSocket relay server (Node.js + ws)

tests/
├── crypto/          # Unit tests for all crypto modules
├── protocol/        # Session state machine tests
├── stores/          # Zustand store tests
├── server/          # WebSocket server integration tests
└── integration/     # End-to-end crypto flow tests
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Post-Quantum Crypto | [fips-crypto](https://www.npmjs.com/package/fips-crypto) (ML-KEM-768, ML-DSA-65) |
| Symmetric Encryption | XChaCha20-Poly1305 via @noble/ciphers |
| Frontend | React 19 + TypeScript + Vite |
| State Management | Zustand |
| Styling | Tailwind CSS (dark/light mode) |
| WebSocket Server | Node.js + ws |
| Testing | Vitest |

## Tests

```bash
make test
```

**67 tests** across 10 test files:

| Suite | Tests | Coverage |
|-------|-------|----------|
| `crypto/encoding` | 8 | Base64 round-trips, UTF-8, fingerprints |
| `crypto/identity` | 2 | Key generation, correct sizes, uniqueness |
| `crypto/kem` | 4 | Encapsulate/decapsulate match, different secrets per session |
| `crypto/symmetric` | 8 | Round-trips, nonce uniqueness, tamper detection, wrong-key rejection, 1MB file |
| `crypto/signing` | 5 | Sign/verify, tamper rejection, wrong-key rejection |
| `crypto/envelope` | 7 | Deterministic output, metadata binding (timestamp, filename, MIME type) |
| `protocol/session` | 5 | State machine transitions |
| `stores` | 8 | All Zustand store CRUD operations |
| `server` | 7 | Registration, peer discovery, message relay, error handling |
| `integration/e2e` | 7 | Full text + file exchange, impersonation detection, relay-tampered metadata detection, tampered ciphertext, multi-message sessions |

## Security Model

### Threat model

This demo assumes an **honest-but-curious relay** that faithfully delivers messages but may attempt to read content. The relay server never sees plaintext — all messages and files are encrypted client-side before transmission.

### Protections implemented

- **Secret keys never leave the browser** — only public keys are transmitted
- **End-to-end encryption** — the relay server cannot decrypt messages or files
- **Authenticated signed envelope** — signatures cover the full message envelope (ciphertext + timestamp + message type + file metadata), preventing the relay from rewriting metadata without breaking the signature
- **Signature-gated decryption** — messages with invalid signatures are rejected before decryption; they appear as `[Message rejected: invalid signature]` and the ciphertext is never decrypted or rendered
- **Peer identity pinning** — during key exchange, the peer's ML-DSA public key is verified against the key announced during peer discovery; mismatched keys are rejected
- **Per-session keys** — each key exchange produces a fresh shared secret via ML-KEM
- **Random nonces** — XChaCha20-Poly1305 uses 24-byte random nonces (safe for random generation)
- **Payload size limits** — the server enforces an 8 MB `maxPayload` at the WebSocket frame level, and the receiver rejects oversized base64 payloads before decoding

### Known limitations

- **No out-of-band fingerprint verification** — peer identity is pinned from the relay's `peer-list` / `peer-joined` messages. A malicious relay could substitute a different public key during discovery (MITM). Production systems should add out-of-band fingerprint comparison (e.g., QR code scanning, safety numbers).
- **No forward secrecy** — compromising a KEM secret key retroactively decrypts all messages in that session. Production systems should implement ratcheting (e.g., Double Ratchet with PQC KEM).
- **No message ordering or replay protection** — the protocol does not enforce message sequence numbers. A relay could replay or reorder messages.
- **Ephemeral keys** — keys exist only in browser memory and are lost on page reload. This is by design for a demo.

> **Note:** This is a demo application for educational purposes. It is not audited for production use.

## License

MIT
