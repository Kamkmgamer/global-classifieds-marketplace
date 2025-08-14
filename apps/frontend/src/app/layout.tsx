import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Global Classifieds Marketplace",
    template: "%s | Global Classifieds",
  },
  description: "Buy and sell anything globally. Post listings, chat in real-time, and close deals fast.",
  applicationName: "Global Classifieds",
  authors: [{ name: "Global Classifieds" }],
  keywords: [
    "classifieds",
    "marketplace",
    "buy",
    "sell",
    "chat",
    "listings",
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Global Classifieds Marketplace",
    description:
      "Buy and sell anything globally. Post listings, chat in real-time, and close deals fast.",
    type: "website",
    locale: "en_US",
    siteName: "Global Classifieds",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Classifieds Marketplace",
    description:
      "Buy and sell anything globally. Post listings, chat in real-time, and close deals fast.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#38bdf8" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main id="content" className="flex-1 focus:outline-none">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
