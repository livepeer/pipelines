"use client";

import { usePreviewStore } from "@/hooks/usePreviewStore";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const PreviewController = () => {
  const pathname = usePathname();
  const { setIsPreviewOpen } = usePreviewStore();

  useEffect(() => {
    if (pathname.startsWith("/clips")) setIsPreviewOpen(true);
    else setIsPreviewOpen(false);
  }, [pathname]);

  return <></>;
};
