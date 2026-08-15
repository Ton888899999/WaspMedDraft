import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
};

// HMR is disabled in AI Studio via DISABLE_HMR env var.
// File watching is disabled to prevent flickering during agent edits.
// Only attach the webpack config when needed so Turbopack (`next dev --turbopack`)
// doesn't warn about an unused webpack configuration.
if (process.env.DISABLE_HMR === 'true') {
  nextConfig.webpack = (config, {dev}) => {
    if (dev) {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  };
}

export default nextConfig;
