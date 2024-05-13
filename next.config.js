// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.bing.com'
      },
    ],
  },
};

module.exports = nextConfig;
