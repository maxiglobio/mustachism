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

export function getPublicSiteUrl(): string {
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

const LOGIN_SUBJECT = 'Your MUSTACHISM sign-in link'

function loginEmailHtml(siteUrl: string, link: string): string {
  const logoUrl = `${siteUrl}/assets/images/apple-touch-icon.png`
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${LOGIN_SUBJECT}</title>
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
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:400;color:#171717;line-height:1.35;">Sign in</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#404040;">
                Use the button below to sign in and view your licenses. The link expires in 15 minutes.
              </p>
              <a href="${link}" style="display:inline-block;padding:12px 28px;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:4px;font-size:15px;">Sign in</a>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373;font-family:ui-monospace,Courier,monospace;">
                Didn’t ask for this? You can ignore this email.
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

function loginEmailText(link: string): string {
  return [
    'MUSTACHISM',
    '',
    'Sign in to view your licenses (link expires in 15 minutes):',
    link,
    '',
    'Didn’t ask for this? You can ignore this email.',
  ].join('\n')
}

/**
 * Send a magic sign-in link. Without RESEND_API_KEY the link is logged to the server console (dev).
 */
export async function sendLoginLinkEmail(to: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.WAITLIST_EMAIL_FROM?.trim() || 'MUSTACHISM <onboarding@resend.dev>'

  if (!apiKey) {
    console.log('='.repeat(60))
    console.log('📧 SIGN-IN LINK (mock — set RESEND_API_KEY to send)')
    console.log(`To: ${to}`)
    console.log(`Link: ${link}`)
    console.log('='.repeat(60))
    return
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: LOGIN_SUBJECT,
    html: loginEmailHtml(getPublicSiteUrl(), link),
    text: loginEmailText(link),
  })

  if (error) {
    throw new Error(error.message || 'Resend rejected the message')
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

function licenseEmailHtml(siteUrl: string, data: EmailData): string {
  const logoUrl = `${siteUrl}/assets/images/apple-touch-icon.png`
  const name = escapeHtml(data.firstName || 'there')
  const number = escapeHtml(data.licenseNumber)
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${escapeHtml(data.subject)}</title>
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
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:400;color:#171717;line-height:1.35;">Your mustache is officially licensed</h1>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#404040;">Congratulations, ${name}. Your licence number is</p>
              <p style="margin:0 0 24px;font-size:24px;letter-spacing:0.1em;color:#171717;font-family:ui-monospace,Courier,monospace;">${number}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#404040;">
                We’ll engrave your steel card and email you when it ships. You can view your licence any time.
              </p>
              <a href="${siteUrl}/login" style="display:inline-block;padding:12px 28px;background-color:#171717;color:#ffffff;text-decoration:none;border-radius:4px;font-size:15px;">View my licence</a>
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

function licenseEmailText(siteUrl: string, data: EmailData): string {
  return [
    'MUSTACHISM',
    '',
    'Your mustache is officially licensed',
    '',
    `Congratulations, ${data.firstName || 'there'}. Your licence number is ${data.licenseNumber}.`,
    '',
    'We’ll engrave your steel card and email you when it ships.',
    `View your licence: ${siteUrl}/login`,
  ].join('\n')
}

/**
 * Licence-issued confirmation (sent once payment completes). Mock log if Resend is not configured.
 */
export async function sendConfirmationEmail(data: EmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const siteUrl = getPublicSiteUrl()
  const from =
    process.env.WAITLIST_EMAIL_FROM?.trim() || 'MUSTACHISM <onboarding@resend.dev>'

  if (!apiKey) {
    console.log('='.repeat(60))
    console.log('📧 LICENCE EMAIL (mock — set RESEND_API_KEY to send)')
    console.log(`To: ${data.to}`)
    console.log(`Subject: ${data.subject}`)
    console.log(`License Number: ${data.licenseNumber}`)
    console.log('='.repeat(60))
    return
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: [data.to],
    subject: data.subject,
    html: licenseEmailHtml(siteUrl, data),
    text: licenseEmailText(siteUrl, data),
  })

  if (error) {
    throw new Error(error.message || 'Resend rejected the message')
  }
}
