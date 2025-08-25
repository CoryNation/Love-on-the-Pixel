/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

// Add PWA configuration conditionally
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: false
  });
  
  module.exports = withPWA(nextConfig);
} else {
  module.exports = nextConfig;
}
