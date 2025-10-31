/** @type {import('next').NextConfig} */
const nextConfig = {
  // Latest Next.js features (Turbopack compatible)
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
    optimizePackageImports: ['lucide-react'],
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Build optimization (remove standalone for Vercel)
  // output: 'standalone', // Commented out for Vercel deployment
  
  // Modern build settings
  swcMinify: true,
  
  // Webpack optimizations (fallback when not using Turbopack)
  webpack: (config, { isServer }) => {
    // Fix for server-side compatibility
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Build settings
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig