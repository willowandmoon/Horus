import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const pliant = localFont({
  src: [
    {
      path: "../../public/fonts/Pliant-Variable.ttf",
      style: "normal",
    },
    {
      path: "../../public/fonts/Pliant-Italic-Variable.ttf",
      style: "italic",
    }
  ],
  variable: "--font-pliant",
});

export const metadata: Metadata = {
  title: "Horus",
  description: "Red de protección inteligente con tecnología NFC.",
  icons: {
    icon: "/ojo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pliant.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Desregistra service workers obsoletos que causan crashes en dev */}
        <Script id="sw-cleanup" strategy="beforeInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(reg) { reg.unregister(); });
            });
          }
        `}</Script>
        {children}
      </body>
    </html>
  );
}
