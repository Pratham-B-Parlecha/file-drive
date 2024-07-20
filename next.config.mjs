/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "tidy-dogfish-752.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
