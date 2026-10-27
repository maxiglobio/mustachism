import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

const description = 'How MUSTACHISM collects, uses and protects your information when you browse, order a license or create an account.'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description,
  alternates: { canonical: '/privacy-policy' },
  openGraph: { title: 'Privacy Policy — MUSTACHISM', description, url: '/privacy-policy' },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="March 29, 2026">
      <p>This Privacy Policy describes how MUSTACHISM (“we,” “us,” or “our”) collects, uses, and shares information when you use our website, order a license, or create an account.</p>

      <h2>Information we collect</h2>
      <p>We may collect:</p>
      <ul>
        <li><strong>Account and contact data</strong> you provide when you register or complete forms (for example, name and email).</li>
        <li><strong>Order details</strong> related to your license purchase, including license selections and information needed to fulfill your order.</li>
        <li><strong>Payment information</strong> processed by our payment provider. We do not store full card numbers on our servers.</li>
        <li><strong>Technical data</strong> such as IP address, browser type, device information, and pages visited, collected automatically when you use the site.</li>
      </ul>

      <h2>How we use information</h2>
      <p>We use the information above to provide and improve the service, process orders, authenticate accounts, communicate with you about your purchase or account, detect abuse, comply with legal obligations, and analyze usage in aggregate to understand how the site is used.</p>

      <h2>Sharing and processors</h2>
      <p>We may share information with vendors who help us operate the site and process payments (for example, hosting, payment processing, and email). These providers are permitted to use data only to perform services for us and are subject to appropriate confidentiality and security obligations.</p>
      <p>We may disclose information if required by law, to protect rights and safety, or in connection with a business transfer (such as a merger), subject to applicable law.</p>

      <h2>Cookies and local storage</h2>
      <p>We may use cookies or similar technologies for essential site functionality (such as keeping you signed in) and to remember preferences. You can control cookies through your browser settings; disabling certain cookies may limit features.</p>

      <h2>Retention</h2>
      <p>We retain information for as long as needed to provide the service, meet legal and accounting requirements, and resolve disputes. Retention periods vary depending on the type of data and how it is used.</p>

      <h2>Your choices and rights</h2>
      <p>Depending on where you live, you may have rights to access, correct, delete, or export your personal information, or to object to or restrict certain processing. To make a request, contact us using the information below. We may need to verify your identity before responding.</p>

      <h2>Children</h2>
      <p>The service is not directed at children under 13 (or the minimum age in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected such information, please contact us and we will take appropriate steps.</p>

      <h2>International transfers</h2>
      <p>If you access the site from outside the country where we operate, your information may be processed in countries that may have different data protection laws. Where required, we use appropriate safeguards.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this Privacy Policy from time to time. The “Last updated” date at the top will change when we do. Continued use of the site after changes means you accept the updated policy, to the extent permitted by law.</p>

      <h2>Contact</h2>
      <p>For privacy-related questions or requests, please contact us through the contact options provided on this website.</p>

    </LegalPage>
  )
}
