/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained build (.next/standalone) so the Docker image
  // only needs Node + the traced dependencies — much smaller & faster to boot.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
