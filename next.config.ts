import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["arla-roomiest-iconoclastically.ngrok-free.dev"],
  serverExternalPackages: ["tesseract.js", "pdfkit", "fontkit", "restructure", "deep-equal"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
