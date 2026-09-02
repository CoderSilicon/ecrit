import type { Metadata } from "next";
import Script from "next/script";
import { Quicksand, Noto_Serif } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSerif = Noto_Serif({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ecrit",
  description: "A soft, minimal notes app.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${quicksand.variable} ${notoSerif.variable} h-full antialiased`}>
      <head>
        <Script
          id="webmcp-polyfill"
          src="https://unpkg.com/@mcp-b/webmcp-polyfill@latest/dist/index.iife.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-text">{children}</body>
    </html>
  );
}