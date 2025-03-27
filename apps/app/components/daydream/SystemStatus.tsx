import { useSystemStatus } from "@/hooks/useSystemStatus";
import { cn } from "@repo/design-system/lib/utils";
import { ActivityIcon } from "lucide-react";

export const STATUS_PAGE_URL = "https://livepeerdaydream.statuspage.io/";

export default function SystemStatus() {
  const status = useSystemStatus();

  return (
    <div className="w-4 h-4 relative">
      <ActivityIcon className="w-4 h-4 text-foreground" />
      <div
        className={cn(
          "absolute -top-1 -right-1 h-2 w-2 bg-transparent rounded-full",
          status === "none" && "bg-green-500",
          status === "minor" && "bg-yellow-500",
          status === "major" && "bg-orange-500",
          status === "critical" && "bg-red-500",
        )}
      ></div>
    </div>
  );
}
