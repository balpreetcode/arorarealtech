/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,

  async rewrites() {
    const legacyOrigin = process.env.LEGACY_MEDIA_ORIGIN || '';

    if (!legacyOrigin) {
      return [];
    }

    return [
      {
        source: '/sites/default/files/:path*',
        destination: `${legacyOrigin}/sites/default/files/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/sites/default/files/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
