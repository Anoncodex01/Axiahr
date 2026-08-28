import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [],

  // Make JWT secret available to Edge runtime (middleware)
  env: {
    NEXT_PUBLIC_JWT_SECRET: process.env.JWT_SECRET, // <-- ADD THIS
  },

  // Disable dev indicators in production
  ...(process.env.NODE_ENV === 'production'
    ? {
        devIndicators: false,
      }
    : {}),

  // Security headers and CORS configuration
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigin = isProduction
      ? process.env.NEXT_PUBLIC_APP_URL || 'https://axia.co.tz'
      : '*';

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigin,
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },

          // Security headers for production
          ...(isProduction
            ? [
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
                  key: 'Content-Security-Policy',
                  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
