/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**",
        },
        {
          protocol: "http",
          hostname: "**", 
        },
      ],
    },
    experimental: {
      forceSwcTransforms: true,
    },
    server: {
      https: true,
    },
  };
  
  module.exports = nextConfig;
  