/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  typescript: {
    // Skip TypeScript errors during build for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint errors during build for deployment
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
