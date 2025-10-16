/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    // Désactive le cache Webpack uniquement en développement
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
