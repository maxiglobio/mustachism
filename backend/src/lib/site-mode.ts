export function isWaitlistOnly(): boolean {
  return process.env.WAITLIST_ONLY === 'true'
}
