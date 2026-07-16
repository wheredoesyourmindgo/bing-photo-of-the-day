import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  images: {
    // Next 16 only optimizes images at explicitly allow-listed qualities.
    // 100 is what page.tsx requests for the fullscreen photo; 75 is Next's
    // default, kept so any Image without an explicit quality still works.
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.bing.com'
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com'
      }
    ]
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}

export default nextConfig
