/**
 * Mock email service
 * In production, this would integrate with SendGrid, Mailgun, etc.
 */

export interface EmailData {
  to: string
  subject: string
  licenseNumber: string
  firstName: string
  lastName: string
}

/**
 * Send a mock confirmation email
 */
export async function sendConfirmationEmail(data: EmailData): Promise<void> {
  // In a real implementation, this would send an actual email
  // For the MVP demo, we'll just log it
  
  console.log('='.repeat(80))
  console.log('📧 EMAIL CONFIRMATION (Mock)')
  console.log('='.repeat(80))
  console.log(`To: ${data.to}`)
  console.log(`Subject: ${data.subject}`)
  console.log(`License Number: ${data.licenseNumber}`)
  console.log(`Recipient: ${data.firstName} ${data.lastName}`)
  console.log('='.repeat(80))
}
