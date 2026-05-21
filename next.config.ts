import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evitar que Webpack intente empaquetar los workers de tesseract.js
  serverExternalPackages: ['tesseract.js'],
  /* config options here */
};

export default nextConfig;
