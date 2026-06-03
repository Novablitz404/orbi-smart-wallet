import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Terms of Service — Orbi Smart Wallet',
  description: 'Terms of Service for Orbi Smart Wallet.',
};

export default function TermsPage() {
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
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-slate-500 text-sm">Last updated: June 3, 2026</p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Orbi Smart Wallet ("Orbi", "we", "us", or "our") at <strong>orbiwallet.xyz</strong> or <strong>account.orbiwallet.xyz</strong>, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>Orbi is a non-custodial smart contract wallet deployed on the Stellar blockchain. It enables users to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Create and manage a Stellar smart wallet secured by passkeys</li>
              <li>Send and receive XLM, USDC, and other Stellar-based assets</li>
              <li>Connect to decentralized applications (dApps) on Stellar</li>
              <li>Authorize transactions using biometric authentication (Face ID, Touch ID)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Non-Custodial Nature</h2>
            <p>Orbi is a <strong className="text-white">non-custodial</strong> wallet. This means:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>We do not hold, control, or have access to your private keys or funds</li>
              <li>Your passkey is the sole credential securing your wallet — we cannot recover it on your behalf</li>
              <li>You are solely responsible for the security of your device and passkey</li>
              <li>We cannot reverse, cancel, or modify blockchain transactions once submitted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Keep your device and passkey secure at all times</li>
              <li>Provide accurate information when creating your wallet</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
              <li>Not use Orbi for illegal activities, including money laundering, fraud, or sanctions evasion</li>
              <li>Not attempt to reverse-engineer, exploit, or attack Orbi's infrastructure or smart contracts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Blockchain and Smart Contract Risks</h2>
            <p>By using Orbi, you acknowledge and accept the following risks:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Blockchain transactions are irreversible — lost or misdirected funds cannot be recovered</li>
              <li>Smart contracts may contain bugs or vulnerabilities despite security measures</li>
              <li>The Stellar network may experience outages, forks, or changes that affect your wallet</li>
              <li>Cryptocurrency values are highly volatile and may result in significant financial loss</li>
              <li>Regulatory changes in your jurisdiction may restrict your ability to use this service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Gasless Transactions</h2>
            <p>Certain dApps may sponsor transaction fees ("gas") on your behalf via the Orbi SDK. This sponsorship is provided by third-party developers and not by Orbi. We make no guarantee that fee sponsorship will always be available or that sponsored transactions will always succeed.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Prohibited Uses</h2>
            <p>You may not use Orbi to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Violate any applicable law or regulation</li>
              <li>Engage in or facilitate fraudulent, deceptive, or manipulative activity</li>
              <li>Circumvent sanctions or transact with sanctioned individuals or entities</li>
              <li>Distribute malware, spam, or conduct denial-of-service attacks</li>
              <li>Infringe upon the intellectual property rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Disclaimer of Warranties</h2>
            <p>Orbi is provided <strong className="text-white">"as is"</strong> without warranties of any kind. We do not warrant that the service will be uninterrupted, error-free, or secure. To the maximum extent permitted by law, we disclaim all implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Orbi and its founders, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of funds, data, or profits — arising from your use of or inability to use the service, even if we have been advised of the possibility of such damages.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Intellectual Property</h2>
            <p>All content, branding, code, and materials on orbiwallet.xyz are owned by or licensed to Orbi. The smart contracts deployed on Stellar are open-source where indicated. You may not reproduce, distribute, or create derivative works without our written consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to Terms</h2>
            <p>We may update these Terms at any time. We will notify users of material changes by updating the "Last updated" date above. Continued use of the service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with applicable law. Any disputes shall be resolved through binding arbitration to the extent permitted by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@orbiwallet.xyz" className="text-[#30b27c] hover:underline">support@orbiwallet.xyz</a>.</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-slate-500 text-sm hover:text-white transition-colors">← Back to Orbi</Link>
          <Link href="/privacy" className="text-slate-500 text-sm hover:text-white transition-colors">Privacy Policy →</Link>
        </div>

      </main>
    </div>
  );
}
