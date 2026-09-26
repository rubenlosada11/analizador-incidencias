import type { NextConfig } from "next";

// URL de la API de TrackFlow (services/api). El navegador llama a /api/* en el
// mismo origen y Next.js reenvía la petición, así que no hace falta CORS.
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_BASE_URL}/api/:path*` }];
  },
};

export default nextConfig;
