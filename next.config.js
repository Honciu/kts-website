/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint during production builds pentru deployment rapid
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript errors rămân active
    ignoreBuildErrors: false,
  },
  // Optimizări pentru Vercel
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  }
};

export default nextConfig;