import "@/styles/globals.css";

import type { ReactNode } from "react";
import { Viewport } from "next";
import { Inter } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider";

const icons = [
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    url: "/icons/apple-touch-icon.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "192x192",
    url: "/icons/android-chrome-192x192.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    url: "/icons/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    url: "/icons/favicon-16x16.png",
  },
];

const images = "/banner.png";
const siteName = "quranjs.com";
const title = "QuranJS";
const description =
  "A library for fetching quran data from the Quran.com API on both Node.js and the browser.";

export const metadata = {
  title: {
    default: "QuranJS",
    template: "%s | QuranJS",
  },
  description: "QuranJS",
  icons,
  images,
  openGraph: {
    type: "website",
    siteName,
    url: "/",
    title,
    locale: "no",
    description,
    images,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ahmedriad1_",
    title,
    description,
    images,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5828e3",
};

const inter = Inter({
  subsets: ["latin"],
  weight: "variable",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
