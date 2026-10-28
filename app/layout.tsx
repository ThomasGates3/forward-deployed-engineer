import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

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
