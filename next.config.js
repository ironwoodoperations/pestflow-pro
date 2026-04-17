/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.next.json',
  },
  reactStrictMode: true,
  trailingSlash: false,
  // Don't lint Vite source — it has its own ESLint setup.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
