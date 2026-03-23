import Tooltip from './Tooltip';

export default function HowItWorksView() {
  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">How This Demo Works</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Every message is protected by post-quantum cryptography —
            algorithms designed to resist attacks from both classical and quantum computers.
          </p>
        </div>

        <Section number="1" title="Key Generation" subtitle="When you enter your nickname">
          <p>Two keypairs are generated in your browser using fips-crypto:</p>
          <AlgoCard name="ML-KEM-768" standard="FIPS 203" purpose="Key Encapsulation"
            details={['Public key: 1,184 bytes — shared with peers', 'Secret key: 2,400 bytes — never leaves your browser', 'Based on the Module Lattice problem']}
          />
          <AlgoCard name="ML-DSA-65" standard="FIPS 204" purpose="Digital Signatures"
            details={['Public key: 1,952 bytes — shared with peers', 'Secret key: 4,032 bytes — never leaves your browser', 'Signs every message for authenticity']}
          />
        </Section>

        <Section number="2" title="Key Exchange" subtitle="When you click a peer's name">
          <p>
            <Tooltip term="ML-KEM" explanation="Module Lattice Key Encapsulation Mechanism — one party 'encapsulates' a random secret for the other to 'decapsulate'." />{' '}
            establishes a shared secret:
          </p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 font-mono text-xs space-y-2">
            <FlowStep from="You" to="Peer" label="Send ML-KEM public key (1,184 bytes)" />
            <FlowStep from="Peer" to="" label="Generate random 32-byte shared secret" />
            <FlowStep from="Peer" to="" label="Encapsulate with your public key → ciphertext (1,088 bytes)" />
            <FlowStep from="Peer" to="You" label="Send ciphertext back" />
            <FlowStep from="You" to="" label="Decapsulate → same 32-byte shared secret" />
            <div className="text-emerald-600 dark:text-emerald-400 pt-1">✓ Both sides share a 32-byte symmetric key</div>
          </div>
        </Section>

        <Section number="3" title="Sending a Message" subtitle="Encrypt-then-Sign">
          <p>Each message goes through two operations:</p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 font-mono text-xs space-y-3">
            <div>
              <div className="text-quantum-600 dark:text-quantum-300 mb-1 font-semibold">Step 1: Encrypt</div>
              <div className="text-gray-600 dark:text-gray-400">
                "Hello!" → <span className="text-gray-800 dark:text-gray-300">XChaCha20-Poly1305</span>(shared key) → ciphertext
              </div>
              <div className="text-gray-400 dark:text-gray-600 text-[10px] mt-0.5">24-byte random nonce + encrypted data + 16-byte auth tag</div>
            </div>
            <div>
              <div className="text-quantum-600 dark:text-quantum-300 mb-1 font-semibold">Step 2: Sign</div>
              <div className="text-gray-600 dark:text-gray-400">
                ciphertext → <span className="text-gray-800 dark:text-gray-300">ML-DSA-65</span>(secret key) → 3,309-byte signature
              </div>
              <div className="text-gray-400 dark:text-gray-600 text-[10px] mt-0.5">Proves authorship — unforgeable even by quantum computers</div>
            </div>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">
            Click "crypto" on any message bubble to see actual sizes and timings.
          </p>
        </Section>

        <Section number="4" title="Receiving a Message" subtitle="Verify-then-Decrypt">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 font-mono text-xs space-y-3">
            <div>
              <div className="text-quantum-600 dark:text-quantum-300 mb-1 font-semibold">Step 1: Verify signature</div>
              <div className="text-gray-600 dark:text-gray-400">(signature, ciphertext, sender's public key) → <span className="text-emerald-600 dark:text-emerald-400">✓ authentic</span></div>
            </div>
            <div>
              <div className="text-quantum-600 dark:text-quantum-300 mb-1 font-semibold">Step 2: Decrypt</div>
              <div className="text-gray-600 dark:text-gray-400">ciphertext → <span className="text-gray-800 dark:text-gray-300">XChaCha20-Poly1305</span>(shared key) → "Hello!"</div>
            </div>
          </div>
        </Section>

        <Section number="5" title="Why Post-Quantum?" subtitle="Future-proofing against quantum threats">
          <p>
            Classical algorithms (RSA, ECDH) can be broken by quantum computers.
            ML-KEM and ML-DSA are based on lattice problems that remain hard for both classical and quantum machines.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-xs space-y-2">
            {[
              ['Implementation', 'fips-crypto'],
              ['Key Exchange', 'ML-KEM-768 (FIPS 203)'],
              ['Signatures', 'ML-DSA-65 (FIPS 204)'],
              ['Encryption', 'XChaCha20-Poly1305'],
              ['Security Category', '3 (AES-192 equivalent)'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{k}</span>
                <span className="text-gray-800 dark:text-gray-200 font-mono">{v}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ number, title, subtitle, children }: {
  number: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-quantum-500 flex items-center justify-center text-xs font-bold text-white">{number}</span>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 ml-8">{subtitle}</p>
      </div>
      <div className="ml-8 space-y-3 text-sm text-gray-600 dark:text-gray-400">{children}</div>
    </div>
  );
}

function AlgoCard({ name, standard, purpose, details }: {
  name: string; standard: string; purpose: string; details: string[];
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-mono text-sm font-semibold text-quantum-600 dark:text-quantum-300">{name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">{standard}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">— {purpose}</span>
      </div>
      <ul className="text-xs text-gray-500 space-y-0.5">
        {details.map((d, i) => <li key={i}>• {d}</li>)}
      </ul>
    </div>
  );
}

function FlowStep({ from, to, label }: { from: string; to: string; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-quantum-500 dark:text-quantum-400 shrink-0 w-24">
        {to ? <>{from} <span className="text-gray-300 dark:text-gray-600">→</span> {to}</> : <span className="text-right block">{from}</span>}
      </span>
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
}
