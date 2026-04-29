/**
 * Email: optional Resend for transactional mail; mock log when unconfigured.
 */

import { Resend } from 'resend'

export interface EmailData {
  to: string
  subject: string
  licenseNumber: string
  firstName: string
  lastName: string
}

function getPublicSiteUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (base) return base.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`.replace(/\/$/, '')
  return 'https://www.mustachism.com'
}

function waitlistEmailHtml(siteUrl: string): string {
  const logoUrl = `${siteUrl}/assets/images/apple-touch-icon.png`
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>You’re on the MUSTACHISM waitlist</title>
</head>
<body style="margin:0;padding:0;background-color:#fafafa;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafafa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border:1px solid #e5e5e5;border-radius:8px;">
          <tr>
            <td style="padding:32px 28px 24px;text-align:center;">
              <img src="${logoUrl}" alt="MUSTACHISM" width="72" height="72" style="display:block;margin:0 auto 20px;border:0;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#737373;font-family:ui-monospace,Courier,monospace;">MUSTACHISM</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:400;color:#171717;line-height:1.35;">You’re on the list</h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#404040;">
                Thanks for raising your hand. We’ll email you when licenses open — early access, no spam.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#737373;font-family:ui-monospace,Courier,monospace;">
                A license for what remains.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#a3a3a3;text-align:center;font-family:ui-monospace,Courier,monospace;">
                <a href="${siteUrl}" style="color:#737373;text-decoration:underline;">mustachism.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}

const WAITLIST_SUBJECT = 'You’re on the MUSTACHISM waitlist'

function waitlistEmailText(siteUrl: string): string {
  return [
    'MUSTACHISM',
    '',
    'You’re on the list',
    '',
    'Thanks for raising your hand. We’ll email you when licenses open — early access, no spam.',
    '',
    'A license for what remains.',
    '',
    siteUrl,
  ].join('\n')
}

/**
 * Send waitlist confirmation (new signups only). No-op / mock log if Resend is not configured.
 */
export async function sendWaitlistConfirmationEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const siteUrl = getPublicSiteUrl()
  const from =
    process.env.WAITLIST_EMAIL_FROM?.trim() || 'MUSTACHISM <onboarding@resend.dev>'

  if (!apiKey) {
    console.log('='.repeat(60))
    console.log('📧 WAITLIST EMAIL (mock — set RESEND_API_KEY to send)')
    console.log(`To: ${to}`)
    console.log(`Subject: ${WAITLIST_SUBJECT}`)
    console.log(`From: ${from}`)
    console.log('='.repeat(60))
    return
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: WAITLIST_SUBJECT,
    html: waitlistEmailHtml(siteUrl),
    text: waitlistEmailText(siteUrl),
  })

  if (error) {
    throw new Error(error.message || 'Resend rejected the message')
  }
}

/**
 * Send a mock confirmation email (order / license flow)
 */
export async function sendConfirmationEmail(data: EmailData): Promise<void> {
  console.log('='.repeat(80))
  console.log('📧 EMAIL CONFIRMATION (Mock)')
  console.log('='.repeat(80))
  console.log(`To: ${data.to}`)
  console.log(`Subject: ${data.subject}`)
  console.log(`License Number: ${data.licenseNumber}`)
  console.log(`Recipient: ${data.firstName} ${data.lastName}`)
  console.log('='.repeat(80))
}
