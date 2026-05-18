import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["arla-roomiest-iconoclastically.ngrok-free.dev"],
  serverExternalPackages: ["pdfkit", "fontkit", "restructure", "deep-equal"],
  /* config options here */
};

export default nextConfig;
