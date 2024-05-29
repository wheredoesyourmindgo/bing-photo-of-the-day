// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.bing.com",
      },
    ],
  },
};

module.exports = nextConfig;
