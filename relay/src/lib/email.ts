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
      from: 'Orbi Wallet <recovery@orbiwallet.xyz>',
      to,
      subject: 'Your Orbi Wallet recovery code',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Orbi Wallet Recovery</title>
</head>
<body style="margin:0;padding:0;background:#020817;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020817;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">

          <!-- Logo / header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img
                src="https://account.orbiwallet.xyz/Orbi%20logo%20-%20Landscape%20white.png"
                alt="Orbi Wallet"
                width="140"
                style="height:auto;display:block;"
              />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:40px 36px;">

              <!-- Title -->
              <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">Recovery Code</p>
              <h1 style="margin:0 0 24px;color:#fff;font-size:24px;font-weight:700;line-height:1.2;">
                Recover your wallet
              </h1>
              <p style="margin:0 0 32px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Use the code below to recover access to your Orbi smart wallet. This code expires in <strong style="color:#e2e8f0;">10 minutes</strong>.
              </p>

              <!-- OTP -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center" style="background:#020817;border:1px solid #334155;border-radius:12px;padding:24px;">
                    <span style="color:#fff;font-size:42px;font-weight:700;letter-spacing:16px;font-family:'Courier New',monospace;">${otp}</span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #1e293b;margin:0 0 24px;" />

              <!-- Footer note -->
              <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                If you did not request this, you can safely ignore this email. Your wallet remains secure.
              </p>
            </td>
          </tr>

          <!-- Bottom links -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;color:#334155;font-size:12px;">
                <a href="https://account.orbiwallet.xyz" style="color:#3b82f6;text-decoration:none;">account.orbiwallet.xyz</a>
                &nbsp;·&nbsp;
                <a href="https://orbiwallet.xyz" style="color:#334155;text-decoration:none;">orbiwallet.xyz</a>
              </p>
              <p style="margin:8px 0 0;color:#1e293b;font-size:11px;">
                © 2026 Orbi Wallet. The first smart wallet on Stellar.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(`Email send failed: ${err.message ?? res.status}`);
  }
}
