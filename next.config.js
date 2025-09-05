/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  // Enable compression
  compress: true,
  // Optimize bundle
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // More aggressive bundle splitting to break down 305kB vendor bundle
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 200000, // Limit chunk size to 200kB
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 30,
            maxSize: 100000,
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            chunks: 'all',
            priority: 20,
            maxSize: 150000,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 15,
            maxSize: 100000,
          },
          firebase: {
            test: /[\\/]node_modules[\\/]firebase[\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 15,
            maxSize: 100000,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: -10,
            maxSize: 150000,
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
