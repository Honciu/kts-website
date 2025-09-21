/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript errors rămân active pentru siguranță
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
