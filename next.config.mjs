/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  eslint: {
    // Ignore build errors on production builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Ignore build errors on production builds
    ignoreBuildErrors: false,
  },
}

export default nextConfig