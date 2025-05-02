import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black m-0 p-0 overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
