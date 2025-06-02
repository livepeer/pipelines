import { TrackedButton } from "@/components/analytics/TrackedButton";
import useMobileStore from "@/hooks/useMobileStore";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Menu,
  X,
  SquareDashedBottomCode,
  Workflow,
} from "lucide-react";
import { useState } from "react";

export const HeaderSection = ({
  onTryCameraClick,
  className,
}: {
  onTryCameraClick: () => void;
  className?: string;
}) => {
  const { isMobile } = useMobileStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleJoinDiscordClick = () => {
    window.open("https://discord.gg/5sZu8xmn6U", "_blank");
    setIsMenuOpen(false);
  };

  const handleCreateClick = () => {
    onTryCameraClick();
    setIsMenuOpen(false);
  };

  const handleRequestAPIClick = () => {
    window.open(
      "https://share.hsforms.com/2c2Uw6JsHTtiiAyAH0-4itA3o1go",
      "_blank",
      "noopener,noreferrer",
    );
    setIsMenuOpen(false);
  };

  const handleBuildClick = () => {
    window.open("https://comfystream.org/", "_blank", "noopener,noreferrer");
    setIsMenuOpen(false);
  };

  return (
    <div
      className={cn(
        "flex flex-row w-full justify-between items-center h-12 pt-4 z-[9999]",
        isMobile
          ? "px-4 pr-2 pt-0 top-0 left-0 right-0 z-50 bg-transparent"
          : "-mb-2",
        className,
      )}
    >
      <h1
        className="text-2xl md:text-4xl font-black tracking-wider italic"
        style={{ color: "#000000" }}
      >
        DAYDREAM
      </h1>

      {isMobile ? (
        <>
          {/* Hamburger Menu Button */}
          <TrackedButton
            className="px-4 py-2 shadow-2xl rounded-lg bg-transparent text-black hover:bg-gray-100 flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            trackingEvent="mobile_header_menu_clicked"
            trackingProperties={{
              location: "mobile_header",
              action: isMenuOpen ? "close" : "open",
            }}
            variant="default"
          >
            {isMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </TrackedButton>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence mode="popLayout">
            {isMenuOpen && (
              <motion.div
                layout="position"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.1 }}
                className="fixed h-[calc(100dvh-3rem)] top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 py-2"
              >
                <TrackedButton
                  className="w-full py-4 px-4 text-black hover:bg-gray-50 flex items-center gap-3 justify-start transition-colors duration-200"
                  onClick={handleJoinDiscordClick}
                  trackingEvent="mobile_menu_join_discord_clicked"
                  trackingProperties={{ location: "mobile_menu" }}
                  variant="ghost"
                >
                  <DiscordLogoIcon className="h-5 w-5" />
                  <span className="text-sm font-normal">Join Discord</span>
                </TrackedButton>

                <Separator className="my-2" orientation="horizontal" />

                <TrackedButton
                  className="w-full py-4 px-4 text-black hover:bg-gray-50 flex items-center gap-3 justify-start transition-colors duration-200"
                  onClick={handleCreateClick}
                  trackingEvent="mobile_menu_start_creating_clicked"
                  trackingProperties={{ location: "mobile_menu" }}
                  variant="ghost"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-sm font-normal">Create</span>
                </TrackedButton>

                <Separator className="my-2" orientation="horizontal" />

                <TrackedButton
                  className="w-full py-4 px-4 text-black hover:bg-gray-50 flex items-center gap-3 justify-start transition-colors duration-200"
                  onClick={handleRequestAPIClick}
                  trackingEvent="mobile_menu_request_api_access_clicked"
                  trackingProperties={{ location: "mobile_menu" }}
                  variant="ghost"
                >
                  <SquareDashedBottomCode className="h-5 w-5" />
                  <span className="text-sm font-normal">
                    Request API Access
                  </span>
                </TrackedButton>

                <Separator className="my-2" orientation="horizontal" />

                <TrackedButton
                  className="w-full py-4 px-4 text-black hover:bg-gray-50 flex items-center gap-3 justify-start transition-colors duration-200"
                  onClick={handleBuildClick}
                  trackingEvent="mobile_menu_build_with_comfystream_clicked"
                  trackingProperties={{ location: "mobile_menu" }}
                  variant="ghost"
                >
                  <Workflow className="h-5 w-5" />
                  <span className="text-sm font-normal">
                    Build with ComfyStream
                  </span>
                </TrackedButton>

                <Separator className="my-2" orientation="horizontal" />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        // Desktop buttons (unchanged)
        <div className="w-full py-3 flex items-center justify-end gap-2">
          <TrackedButton
            className="py-2 rounded-lg bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2"
            onClick={handleJoinDiscordClick}
            trackingEvent="explore_header_join_discord_clicked"
            trackingProperties={{ location: "explore_header" }}
            variant="default"
          >
            <DiscordLogoIcon className="h-4 w-4" />
            Join Discord
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
      )}
    </div>
  );
};
