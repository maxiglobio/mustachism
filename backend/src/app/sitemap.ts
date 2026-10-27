import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes: Array<[string, number, MetadataRoute.Sitemap[number]['changeFrequency']]> = [
    ['/', 1, 'weekly'],
    ['/story', 0.8, 'monthly'],
    ['/order', 0.9, 'weekly'],
    ['/license-select', 0.6, 'weekly'],
    ['/privacy-policy', 0.2, 'yearly'],
    ['/terms-of-service', 0.2, 'yearly'],
  ]
  return routes.map(([path, priority, changeFrequency]) => ({
    url: new URL(path, SITE.url).toString(),
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
