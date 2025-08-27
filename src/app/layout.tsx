import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LogAllot Provision Error Log Analysis - AI-Powered Log Analysis",
  description: "Advanced error log analysis platform powered by AI. Analyze, debug, and resolve errors across your infrastructure with LogAllot.",
  keywords: ["LogAllot", "error log analysis", "AI debugging", "log analysis", "error monitoring", "Next.js", "TypeScript"],
  authors: [{ name: "LogAllot Team" }],
  openGraph: {
    title: "LogAllot Provision Error Log Analysis",
    description: "AI-powered error log analysis and debugging platform",
    url: "https://logallot.com",
    siteName: "LogAllot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LogAllot Provision Error Log Analysis",
    description: "AI-powered error log analysis and debugging platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}


