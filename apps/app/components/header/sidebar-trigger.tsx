"use client";

import useMobileStore from "@/hooks/useMobileStore";
import { Separator } from "@repo/design-system/components/ui/separator";
import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";

const MobileSidebarTrigger = () => {
  const { isMobile } = useMobileStore();

  if (!isMobile) return null;

  return (
    <div className="flex w-screen h-16 items-center gap-2 border-border border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
    </div>
  );
};

export default MobileSidebarTrigger;
