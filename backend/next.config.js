/** @type {import('next').NextConfig} */
const legacy = ['story', 'order', 'license-select', 'personal-info', 'login', 'dashboard', 'privacy-policy', 'terms-of-service']

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: { formats: ['image/avif', 'image/webp'] },
  outputFileTracingIncludes: { '/**/opengraph-image': ['./src/lib/og/card.png'] },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      ...legacy.map((p) => ({ source: `/${p}.html`, destination: `/${p}`, permanent: true })),
    ]
  },
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ]
  },
}

module.exports = nextConfig
