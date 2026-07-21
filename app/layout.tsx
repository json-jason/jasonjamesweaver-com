import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "Jason Weaver — Technology Leader & AI Explorer";
const siteDescription =
  "20+ years leading global platform operations, cloud platforms, and high-performing teams at scale. Exploring the power of AI and automation to build better systems for work and life.";

export const metadata: Metadata = {
  metadataBase: new URL("https://jasonjamesweaver.com"),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description:
      "Technology Leader & AI Explorer. Platform operations, cloud platforms, and building better systems.",
    url: "/",
    siteName: "Jason Weaver",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Jason Weaver — Technology Leader & AI Explorer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description:
      "Technology Leader & AI Explorer. Platform operations, cloud platforms, and building better systems.",
    images: ["/og-image.jpg"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}