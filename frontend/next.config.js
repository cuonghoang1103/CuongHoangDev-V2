/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: process.env.NEXT_PUBLIC_API_URL + '/:path*' }];
  },
};

module.exports = nextConfig;
