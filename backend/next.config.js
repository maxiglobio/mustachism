/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/story', destination: '/story.html' },
      { source: '/privacy-policy', destination: '/privacy-policy.html' },
      { source: '/terms-of-service', destination: '/terms-of-service.html' },
    ]
  },
}

module.exports = nextConfig
