import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Nothing here uses next/image, but /_next/image is mounted regardless and
  // feeds request-controlled input to sharp, which carries open libvips
  // advisories (GHSA-f88m-g3jw-g9cj). This unmounts the route — it now 404s —
  // so no request can reach sharp, instead of relying on remotePatterns being
  // empty to reject remote sources.
  images: { unoptimized: true },
};

export default nextConfig;
