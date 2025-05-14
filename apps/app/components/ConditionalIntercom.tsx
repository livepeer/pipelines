"use client";

import { usePathname } from "next/navigation";
import Intercom from "@/components/intercom";

export default function ConditionalIntercom() {
  const pathname = usePathname();

  // Only render Intercom if not on the landing page
  if (pathname === "/") return null;

  return <Intercom />;
}
