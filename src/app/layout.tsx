import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "منصة تحليل ومقارنة المواقع الإلكترونية",
  description:
    "منصة تعليمية لتمكين الطلاب من تحليل المتاجر والمواقع الإلكترونية ومقارنتها عمليًا، وإدارة كاملة للأسئلة والمستويات والتحليلات والتقارير.",
  keywords: [
    "تحليل مواقع",
    "تجارة إلكترونية",
    "مقارنة متاجر",
    "منصة تعليمية",
    "تحليل B2C",
  ],
  authors: [{ name: "Platform Team" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-cairo antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <Sonner position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
