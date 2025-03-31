import { useDreamshaperStore } from "@/hooks/useDreamshaper";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import * as Player from "@livepeer/react/player";
import { StopwatchIcon } from "@radix-ui/react-icons";
import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import {
  Ellipsis,
  Loader2,
  PauseIcon,
  PlayIcon,
  SlidersVertical,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { create } from "zustand";
import { usePlayerPositionStore } from "./usePlayerPosition";

interface PlayerControlsState {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
}

const usePlayercontrolsStore = create<PlayerControlsState>((set, get) => ({
  collapsed: true,
  toggleCollapsed: () => set({ collapsed: !get().collapsed }),
  setCollapsed: collapsed => set({ collapsed }),
}));

export const PlayerControls = () => {
  const { isMobile } = useMobileStore();
  const { loading, streamUrl } = useDreamshaperStore();
  const { isFullscreen } = useFullscreenStore();
  const { position } = usePlayerPositionStore();

  if (!streamUrl) return null;

  return (
    <div
      className={cn(
        "transition-all duration-100",
        isMobile ? "mx-4 w-auto -mt-2 mb-4" : "absolute z-50",
      )}
      style={
        isMobile
          ? {}
          : {
              position: "fixed",
              bottom: isFullscreen
                ? "80px"
                : `${window.innerHeight - position.bottom + 120}px`,
              left: isFullscreen
                ? "16px"
                : // 1.5rem: Default padding, 0.5rem: Additional padding
                  `calc(${position.left}px + 1.5rem + 0.5rem)`,
            }
      }
    >
      {loading && isMobile ? (
        <div className="w-8 h-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Controls />
      )}
    </div>
  );
};

export const Controls = () => {
  const { collapsed, toggleCollapsed } = usePlayercontrolsStore();
  const context = Player.useMediaContext("CustomComponent", undefined);
  const {
    playing,
    __controlsFunctions: { togglePlay },
  } = Player.useStore(context.store);

  return (
    <div className="flex gap-3">
      <Button
        variant="ghost"
        className={cn(
          "bg-neutral-300/15 backdrop-blur-[12px] border border-neutral-200",
          "w-8 h-8 rounded-full text-neutral-200 mix-blend-difference",
          "transition duration-500",
        )}
        onClick={() => {
          togglePlay();
        }}
      >
        {playing ? (
          <PauseIcon className="px-[0.8px]" />
        ) : (
          <PlayIcon className="px-[0.8px]" />
        )}
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "bg-neutral-300/15 backdrop-blur-[12px] border border-neutral-200",
          "w-8 h-8 rounded-full text-neutral-200 mix-blend-difference",
        )}
        onClick={() => {
          toggleCollapsed();
        }}
      >
        {collapsed ? (
          <Ellipsis className="px-[0.8px] animate-in spin-in duration-300" />
        ) : (
          <X className="px-[0.8px] animate-in spin-in duration-300" />
        )}
      </Button>

      <div
        className={cn(
          "duration-200",
          collapsed ? "opacity-0" : "opacity-100",
          "flex justify-center items-center px-4 gap-3",
          "bg-neutral-300/15 backdrop-blur-[12px] border border-neutral-200",
          "h-8 rounded-full text-neutral-200 mix-blend-difference",
        )}
      >
        <button className="transition duration-200 hover:scale-110">
          <SquarePen className="w-4 h-4" />
        </button>
        <Separator orientation="vertical" className="h-4" />
        <button className="transition duration-200 hover:scale-110">
          <SlidersVertical className="w-4 h-4" />
        </button>
        <button className="transition duration-200 hover:scale-110">
          <StopwatchIcon className="w-4 h-4" />
        </button>
        <Separator orientation="vertical" className="h-4" />
        <button className="transition duration-200 hover:scale-110">
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button className="transition duration-200 hover:scale-110">
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
