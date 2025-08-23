import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  dest: 'public',          
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(
  {
    // Security headers
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
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
        {
          source: '/api/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate',
            },
          ],
        },
      ];
    },

    // Secure image configuration - restrict to HTTPS only for trusted domains
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'img.freepik.com',
        },
        {
          protocol: 'https',
          hostname: 'firebasestorage.googleapis.com',
        },
        {
          protocol: 'https',
          hostname: 'your-logo-url.com',
        },
      ],
    },

    // Enable optimization for production
    swcMinify: process.env.NODE_ENV === 'production',
    
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Enable optimization in production
      if (process.env.NODE_ENV === 'production') {
        config.optimization.minimize = true;
      } else {
        config.optimization.minimize = false;
      }
      return config;
    },
  }
);

export default nextConfig;