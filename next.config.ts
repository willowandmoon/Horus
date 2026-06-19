import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["arla-roomiest-iconoclastically.ngrok-free.dev"],
  serverExternalPackages: ["tesseract.js", "pdfkit", "fontkit", "restructure", "deep-equal"],
};

export default nextConfig;
