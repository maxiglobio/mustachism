export const FAQS = [
  { q: 'Why do mustaches need a license?', a: 'Because everything real gets erased first. We certify what survived.' },
  { q: 'Is this a joke?', a: 'No. Jokes are louder.' },
  { q: 'Do I need to prove anything to get a license?', a: 'No. If you’re here, you already know.' },
  { q: 'What does the license give me?', a: 'Permission. Recognition. A physical mark that says: you’re allowed to be visible.' },
  { q: 'Is the license permanent?', a: 'Nothing is permanent. But this lasts longer than trends.' },
  { q: 'Can I buy this as a gift?', a: 'Yes. Some men need permission more than others.' },
]

export const CODEX = [
  {
    title: 'Thou Shalt Wear Thy Mustache with Dignity',
    body: 'A mustache is not merely facial hair; it is a symbol of pride and self-expression. Wear it with dignity, groom it with care, and let it reflect the respect you have for yourself and others.',
    label: 'Wear thy mustache with dignity — grooming and self-respect.',
  },
  {
    title: 'Thou Shalt Embrace Diversity',
    body: 'Mustachism recognizes no single “correct” mustache style. Whether handlebar, walrus, or pencil-thin, celebrate the diversity of mustache expressions and respect each individual’s choice.',
    label: 'Embracing the diversity of mustache styles and expression.',
  },
  {
    title: 'Thou Shalt Promote Unity and Camaraderie',
    body: 'The mustache is a unifying force. Use it to foster friendship, mutual support, and a sense of community among all who wear one.',
    label: 'Unity, camaraderie, and community among those who wear a mustache.',
  },
  {
    title: 'Thou Shalt Use Thy Mustache for Good',
    body: 'Let your mustache be a force for positive impact. Engage in charitable acts, support men’s health initiatives, and participate in philanthropic events that make a difference.',
    label: 'Using one’s mustache for good and positive impact.',
  },
  {
    title: 'Thou Shalt Spread Joy and Laughter',
    body: 'A mustache can be a source of amusement and joy. Use it to spread laughter, lighten moods, and bring smiles to those around you.',
    label: 'Joy, laughter, and lightness through the mustache.',
  },
  {
    title: 'Thou Shalt Embrace the Mustache Lifestyle',
    body: 'Mustachism is not just about the hair on your face; it’s a lifestyle of adventure, curiosity, and playfulness. Live boldly, like the great mustachioed characters of history.',
    label: 'The mustache lifestyle — adventure and bold living.',
  },
  {
    title: 'Thou Shalt Respect Boundaries',
    body: 'While proud of your mustache, always respect personal space and individual preferences. Not everyone shares your enthusiasm, and that’s perfectly acceptable.',
    label: 'Respect for personal space and boundaries.',
  },
  {
    title: 'Thou Shalt Educate and Inspire',
    body: 'Share the history and cultural significance of the mustache. Inspire future generations to embrace it as a symbol of character, creativity, and camaraderie.',
    label: 'Educating and inspiring through the history of the mustache.',
  },
  {
    title: 'Thou Shalt Remember the Mustachioed Legends',
    body: 'Honor the great mustachioed figures of history and culture. Draw inspiration from their achievements and their iconic mustaches.',
    label: 'Mustachioed legends of history and culture.',
  },
  {
    title: 'Thou Shalt Be a Guardian of Mustachism',
    body: 'Uphold these principles and protect the legacy of the mustache. Ensure that Mustachism continues to be a force for joy, unity, and positive change in the world.',
    label: 'Guarding the legacy of Mustachism.',
  },
].map((c, i) => ({
  ...c,
  n: i + 1,
  video: `/assets/codex-visuals/codex-${i + 1}.mp4`,
  poster: `/assets/codex-visuals/codex-${i + 1}.jpg`,
  mobile: `/assets/codex-visuals/codex-${i + 1}-mobile.svg`,
}))

export const MUSTACHE_FRAMES = Array.from(
  { length: 13 },
  (_, i) => `/assets/story/mustache-${String(i + 1).padStart(2, '0')}.webp`,
)
