import type { Metadata } from "next";
import { Inter, Playfair } from "next/font/google";
import "./globals.css";

const playfair = Playfair({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700"],
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
        className={`${playfair.variable} ${inter.variable} antialiased ${inter.className}`}
      >
        {children}
      </body>
    </html>
  );
}
