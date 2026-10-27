export const LICENSE_CATEGORIES = [
  { id: 'all', label: 'All', numbers: null },
  { id: 'cinema-film', label: 'Cinema', numbers: ['000007', '000012', '000013', '000021', '000027', '000042', '000088', '000101', '000451', '000666', '001984', '002001', '002046'] },
  { id: 'music-audio', label: 'Music', numbers: ['000012', '000033', '000045', '000078', '000432', '000440', '000808'] },
  { id: 'art-design', label: 'Art', numbers: ['000072', '000300'] },
  { id: 'historical-dates', label: 'History', numbers: ['001066', '001492', '001776', '001914', '001945', '001969', '001989', '002001'] },
  { id: 'cultural-symbolic', label: 'Culture', numbers: ['000003', '000007', '000012', '000040', '000100', '000144', '000360', '001000'] },
  { id: 'technology-computing', label: 'Tech', numbers: ['000008', '000016', '000032', '000064', '001024', '002048'] },
  { id: 'sports-games', label: 'Sports', numbers: ['000009', '000018', '000024', '000090'] },
  { id: 'philosophy-literature', label: 'Philosophy', numbers: ['000023', '000073', '000108', '144000'] },
  { id: 'gaming-internet', label: 'Gaming', numbers: ['000404', '000420', '001337', '080085'] },
  { id: 'mathematical-constants', label: 'Math', numbers: ['000003', '000002', '000001', '000000'] },
  { id: 'physics-constants', label: 'Physics', numbers: ['299792', '000006', '000001'] },
  { id: 'astronomy-constants', label: 'Astronomy', numbers: ['149597', '000001', '000070'] },
  { id: 'chemistry-constants', label: 'Chemistry', numbers: ['602214', '000008', '096485'] },
  { id: 'reserved', label: 'Reserved', numbers: ['000001', '000002', '000003', '000004', '000005', '000006', '000007', '000008', '000009', '000010', '000042', '000069', '000100', '000777', '001000', '002024'] },
] as const

export type CategoryId = (typeof LICENSE_CATEGORIES)[number]['id']

export const LICENSE_CLASSES = [
  { id: 'A', help: 'A — Standard: everyday recognition on your license.' },
  { id: 'B', help: 'B — Endurance: for sustained, long-term wear.' },
  { id: 'L', help: 'L — Lifelong: marks a permanent commitment.' },
  { id: 'H', help: 'H — Heritage: highest distinction tier.' },
] as const

export const PREFIXES = ['Mr.', 'Ms.', 'Mrs.', 'Miss', 'Mx.', 'Dr.', 'Prof.', 'Rev.', 'Hon.'] as const

/** "000-020" | "M-0020" | "20" → "000020" */
export function sixDigits(value: string) {
  const s = String(value || '').trim()
  const ddd = /^(\d{3})-(\d{3})$/.exec(s)
  if (ddd) return ddd[1] + ddd[2]
  const n = s.replace(/^M-?/i, '').replace(/-/g, '').replace(/^0+/, '') || '0'
  return n.padStart(6, '0')
}

const numberToCategory = new Map<string, string>()
for (const c of LICENSE_CATEGORIES) {
  if (!c.numbers) continue
  for (const n of c.numbers) if (!numberToCategory.has(n)) numberToCategory.set(n, c.label)
}

/** "000020" | "20" | "000-020" → "000-020" (null if not a number) */
export function toLicenseNumber(value: string) {
  const s = String(value || '').trim()
  if (/^\d{3}-\d{3}$/.test(s)) return s
  const digits = s.replace(/^M-?/i, '').replace(/[-\s]/g, '')
  if (!/^\d{1,6}$/.test(digits)) return null
  const six = digits.padStart(6, '0')
  return `${six.slice(0, 3)}-${six.slice(3)}`
}

export function categoryLabelFor(licenseNumber: string) {
  return numberToCategory.get(sixDigits(licenseNumber)) ?? null
}

export function categoryNumbers(id: CategoryId): readonly string[] | null {
  return LICENSE_CATEGORIES.find((c) => c.id === id)?.numbers ?? null
}

export function matchesSearch(licenseNumber: string, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const qDigits = q.replace(/-/g, '')
  return (
    licenseNumber.toLowerCase().includes(q) ||
    sixDigits(licenseNumber).includes(qDigits) ||
    sixDigits(licenseNumber).replace(/^0+/, '').includes(qDigits.replace(/^0+/, '') || '0')
  )
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(
    amount,
  )
}

export function formatMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

/** YYYY-MM-DD → M/D/YYYY (as engraved on the card) */
export function formatCardDate(value: string | Date | null | undefined) {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value.length === 10 ? `${value}T00:00:00` : value) : value
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
