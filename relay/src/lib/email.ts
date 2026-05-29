/**
 * Send recovery OTP emails via Resend (https://resend.com).
 * Set RESEND_API_KEY in env. Free tier: 3,000 emails/month.
 */
export async function sendRecoveryOtp(to: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY env var not set');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Orbi Wallet <recovery@orbi.xyz>',
      to,
      subject: 'Your Orbi Wallet recovery code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Orbi Wallet Recovery</h2>
          <p>Your recovery code is:</p>
          <h1 style="letter-spacing:8px;font-size:40px">${otp}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(`Email send failed: ${err.message ?? res.status}`);
  }
}
