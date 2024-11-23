import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  dest: 'public',          
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(
  {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
        {
          protocol: 'http',
          hostname: '**',
        },
      ],
    },
    swcMinify: false,
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      config.optimization.minimize = false;
      return config;
    },
  }
);

export default nextConfig;