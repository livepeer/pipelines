import { TrackedButton } from "@/components/analytics/TrackedButton";
import useMobileStore from "@/hooks/useMobileStore";
import { usePrivy } from "@/hooks/usePrivy";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { cn } from "@repo/design-system/lib/utils";
import { Camera } from "lucide-react";

export const HeaderSection = ({
  onTryCameraClick,
}: {
  onTryCameraClick: () => void;
}) => {
  const { authenticated } = usePrivy();
  const { isMobile } = useMobileStore();
  const handleJoinDiscordClick = () => {
    window.open("https://discord.gg/5sZu8xmn6U", "_blank");
  };
  return (
    <div
      className={cn(
        "flex flex-row w-full justify-between items-center h-12 pt-4",
        isMobile ? "px-4 pt-0" : "-mb-2",
      )}
    >
      <h1
        className="text-2xl md:text-4xl font-black tracking-wider italic"
        style={{ color: "#000000" }}
      >
        DAYDREAM
      </h1>
      <div className="w-full py-3 flex items-center justify-end gap-2">
        <TrackedButton
          className={cn(
            "py-2 rounded-lg bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2",
            isMobile && "bg-transparent",
          )}
          onClick={handleJoinDiscordClick}
          trackingEvent="explore_header_join_discord_clicked"
          trackingProperties={{ location: "explore_header" }}
          variant={isMobile ? "link" : "default"}
        >
          <DiscordLogoIcon className="h-4 w-4" />
          {!isMobile && "Join Discord"}
        </TrackedButton>

        <TrackedButton
          className="rounded-lg bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
          onClick={onTryCameraClick}
          trackingEvent="explore_header_start_creating_clicked"
          trackingProperties={{ location: "explore_header" }}
        >
          <Camera className="h-4 w-4" />
          Create
        </TrackedButton>
      </div>
    </div>
  );
};
