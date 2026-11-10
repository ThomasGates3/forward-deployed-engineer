import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (latin variable woff2) so builds never depend on a live Google Fonts fetch.
const display = localFont({ src: "./fonts/space-grotesk-latin.woff2", variable: "--font-display", weight: "300 700", display: "swap" });
const sans = localFont({ src: "./fonts/inter-latin.woff2", variable: "--font-sans", weight: "100 900", display: "swap" });
const mono = localFont({ src: "./fonts/jetbrains-mono-latin.woff2", variable: "--font-mono", weight: "100 800", display: "swap" });

const title = "Thomas Gates III | Forward Deployed Engineer";
const description = "A portfolio of live, working AI tools. I embed with businesses and ship Claude-powered features into production.";
const image = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Thomas Gates III, Forward Deployed Engineer: a portfolio of live AI tools",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio.gatestech.solutions"),
  title,
  description,
  alternates: { canonical: "/" },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Thomas Gates III",
    url: "/",
    title,
    description,
    images: [image],
  },
  twitter: { card: "summary_large_image", title, description, images: [image.url] },
};

export const viewport: Viewport = { themeColor: "#0B0C0E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="grain font-sans antialiased">{children}</body>
    </html>
  );
}
