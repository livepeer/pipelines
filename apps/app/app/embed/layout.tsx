import "@repo/design-system/styles/globals.css";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400"],
});

type EmbedLayoutProperties = {
  readonly children: ReactNode;
};

export const metadata: Metadata = {
  title: "Video Player",
  description: "Embedded video player",
};

export default function EmbedLayout({ children }: EmbedLayoutProperties) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-black`}>
        {children}
      </body>
    </html>
  );
} 