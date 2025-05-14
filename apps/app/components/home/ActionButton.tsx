import React from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Camera } from "lucide-react";

interface ActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function ActionButton({
  onClick,
  icon = <Camera className="h-4 w-4" />,
  children,
}: ActionButtonProps) {
  return (
    <div className="p-4 border-t border-gray-200/30 flex flex-row gap-3 w-full relative z-10">
      <Button
        className="w-full px-4 py-2 h-10 rounded-md md:bg-black md:text-white bg-white text-black hover:bg-gray-100 md:hover:bg-gray-800 flex items-center justify-center gap-2"
        onClick={onClick}
      >
        {icon}
        {children}
      </Button>
    </div>
  );
}
