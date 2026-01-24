import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    const apiBaseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const apiUrl = new URL(apiBaseUrl);
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${apiUrl.origin}/api/:path*`,
        },
        {
          source: "/v1/:path*",
          destination: `${apiUrl.origin}/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
