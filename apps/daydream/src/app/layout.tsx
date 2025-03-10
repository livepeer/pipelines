import type { Metadata } from "next";
import { Inter, Playfair, Open_Sans } from "next/font/google";
import { DesignSystemProvider } from "@repo/design-system/providers";
import "./globals.css";

const playfair = Playfair({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Daydream",
  description: "Transform your video in real-time with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} ${openSans.variable} antialiased ${inter.className}`}
      >
        <DesignSystemProvider defaultTheme="dark">
          {children}
        </DesignSystemProvider>
      </body>
    </html>
  );
}
