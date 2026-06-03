import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Privacy Policy — Orbi Smart Wallet',
  description: 'Privacy Policy for Orbi Smart Wallet.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white">

      {/* Nav */}
      <nav className="fixed top-5 inset-x-0 z-50 flex justify-center px-6">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#020817]/80 backdrop-blur-xl px-3 py-2 shadow-xl shadow-black/30">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Orbi Icon.png" alt="Orbi" width={28} height={28} className="mr-1" />
            <span className="text-white text-sm font-semibold">Orbi</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pt-36 pb-24">

        <div className="mb-12">
          <p className="text-[#30b27c] text-sm font-semibold uppercase tracking-[0.2em] mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: June 3, 2026</p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p>Orbi Smart Wallet ("Orbi", "we", "us", or "our") is committed to protecting your privacy. This policy describes what data we collect, how we use it, and your rights. Orbi is designed with a minimal data footprint — your funds are secured by your passkey, not by us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Data We Collect</h2>
            <p>We collect only what is necessary to provide the service:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li><strong className="text-white">Email address</strong> — used to identify your wallet account and link it to your passkey</li>
              <li><strong className="text-white">Wallet address</strong> — your public Stellar smart contract address, which is public by nature of the blockchain</li>
              <li><strong className="text-white">Passkey credential ID</strong> — a non-secret identifier linking your device passkey to your wallet; we never store your private key</li>
              <li><strong className="text-white">Transaction data</strong> — transactions are recorded on the public Stellar blockchain; we do not store copies beyond what is needed for the relay service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data We Do Not Collect</h2>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Private keys or seed phrases — we never have access to these</li>
              <li>Biometric data — Face ID and Touch ID are processed entirely on your device by your operating system</li>
              <li>Advertising identifiers or behavioral tracking data</li>
              <li>Device fingerprints or precise location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How We Use Your Data</h2>
            <p>We use the data we collect solely to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Create and manage your wallet account</li>
              <li>Authenticate you during sign-in via the passkey relay flow</li>
              <li>Process and relay transactions to the Stellar network</li>
              <li>Respond to support requests</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cookies</h2>
            <p>We use a single strictly necessary cookie:</p>
            <div className="mt-3 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-white font-semibold">Cookie</th>
                    <th className="text-left px-5 py-3 text-white font-semibold">Purpose</th>
                    <th className="text-left px-5 py-3 text-white font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-5 py-3 font-mono text-[#30b27c]">orbi_session</td>
                    <td className="px-5 py-3 text-slate-400">Keeps you signed in and enables server-side routing</td>
                    <td className="px-5 py-3 text-slate-400">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">This cookie is strictly necessary for the service to function and does not require consent under GDPR or CCPA. No third-party or advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p>We retain your account data (email, wallet address, credential ID) for as long as your wallet account exists. You may request deletion of your account data at any time by contacting us. Note that transaction history on the Stellar blockchain is permanent and outside our control.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Third-Party Services</h2>
            <p>Orbi interacts with the following external services:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li><strong className="text-white">Stellar Network</strong> — all transactions are submitted to the public Stellar blockchain</li>
              <li><strong className="text-white">Vercel</strong> — our hosting provider; subject to <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#30b27c] hover:underline">Vercel's Privacy Policy</a></li>
            </ul>
            <p className="mt-3">We do not integrate Google Analytics, Meta Pixel, or any other third-party tracking service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Security</h2>
            <p>We take reasonable technical and organizational measures to protect your data, including encryption in transit (HTTPS) and at rest. However, no system is completely secure. You are responsible for keeping your device and passkey safe.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:support@orbiwallet.xyz" className="text-[#30b27c] hover:underline">support@orbiwallet.xyz</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Children's Privacy</h2>
            <p>Orbi is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last updated" date at the top of this page. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
            <p>For privacy-related questions or requests, contact us at <a href="mailto:support@orbiwallet.xyz" className="text-[#30b27c] hover:underline">support@orbiwallet.xyz</a>.</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-slate-500 text-sm hover:text-white transition-colors">← Back to Orbi</Link>
          <Link href="/terms" className="text-slate-500 text-sm hover:text-white transition-colors">Terms of Service →</Link>
        </div>

      </main>
    </div>
  );
}
