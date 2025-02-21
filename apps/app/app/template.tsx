"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Apply Daydream as title only on the root path
  // TODO: remove this once we split the app in 2, so the Livepeer Pipelines home page has the proper title
  useEffect(() => {
    document.title = pathname === "/" ? "Daydream" : "Livepeer Pipelines";
  }, [pathname]);
  
  return children;
} 