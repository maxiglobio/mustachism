import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

const description = 'The terms that govern your use of the MUSTACHISM website, license orders and related services.'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description,
  alternates: { canonical: '/terms-of-service' },
  openGraph: { title: 'Terms of Service — MUSTACHISM', description, url: '/terms-of-service' },
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="March 29, 2026">
      <p>These Terms of Service (“Terms”) govern your access to and use of the MUSTACHISM website and related services (“Service”). By using the Service, you agree to these Terms. If you do not agree, do not use the Service.</p>

      <h2>The Service</h2>
      <p>MUSTACHISM offers a branded license product and related digital experiences. Descriptions, pricing, and availability on the site are subject to change. We may modify, suspend, or discontinue any part of the Service with reasonable notice where practicable.</p>

      <h2>Eligibility</h2>
      <p>You must be legally able to enter a binding contract in your jurisdiction and meet any minimum age we specify. If you use the Service on behalf of an organization, you represent that you have authority to bind that organization.</p>

      <h2>Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials and for activity under your account. Notify us promptly of any unauthorized use.</p>

      <h2>Orders and payment</h2>
      <p>When you place an order, you offer to purchase the items in your cart at the prices shown. We may accept or decline orders for any lawful reason. Payment is processed by our third-party payment processor. You agree to their terms and to provide accurate billing information.</p>

      <h2>Licenses and digital content</h2>
      <p>Unless we state otherwise, purchases grant you a personal, non-exclusive, non-transferable right to use the delivered materials for private, non-commercial purposes in line with any instructions we provide. You may not resell, redistribute, or misrepresent MUSTACHISM materials or imply endorsement where none exists.</p>

      <h2>Prohibited conduct</h2>
      <p>You agree not to misuse the Service, including by attempting to gain unauthorized access, interfering with security or performance, scraping or harvesting data in violation of these Terms or applicable law, or using the Service for unlawful, harassing, or fraudulent purposes.</p>

      <h2>Intellectual property</h2>
      <p>The Service, including branding, text, graphics, and software, is owned by MUSTACHISM or its licensors and is protected by intellectual property laws. Except for the limited rights expressly granted to you, no rights are transferred.</p>

      <h2>Disclaimer of warranties</h2>
      <p>The Service is provided “as is” and “as available” without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement, to the fullest extent permitted by law.</p>

      <h2>Limitation of liability</h2>
      <p>To the fullest extent permitted by law, MUSTACHISM and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising from your use of the Service. Our aggregate liability for any claim relating to the Service will not exceed the greater of (a) the amount you paid us for the transaction giving rise to the claim in the twelve months before the claim, or (b) one hundred U.S. dollars, except where such limitations are prohibited by law.</p>

      <h2>Indemnity</h2>
      <p>You will defend and indemnify MUSTACHISM and its affiliates against claims, damages, losses, and expenses (including reasonable attorneys’ fees) arising from your use of the Service, your content, or your violation of these Terms, except to the extent caused by our willful misconduct.</p>

      <h2>Governing law and disputes</h2>
      <p>These Terms are governed by the laws of the jurisdiction we designate, without regard to conflict-of-law rules. Courts in that jurisdiction have exclusive venue for disputes, unless mandatory consumer protections in your country require otherwise.</p>

      <h2>Changes</h2>
      <p>We may update these Terms from time to time. We will post the revised Terms and update the “Last updated” date. Continued use after changes constitutes acceptance of the revised Terms where permitted by law.</p>

      <h2>Severability</h2>
      <p>If any provision of these Terms is held invalid or unenforceable, the remaining provisions remain in effect.</p>

      <h2>Contact</h2>
      <p>For questions about these Terms, please contact us through the contact options provided on this website.</p>

    </LegalPage>
  )
}
