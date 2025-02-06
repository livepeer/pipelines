import {
  ClipIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
  LoadingIcon,
  MuteIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  UnmuteIcon,
} from "@livepeer/react/assets";
import * as Player from "@livepeer/react/player";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import React, { useCallback, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";

import { Src } from "@livepeer/react";
import { cn } from "@repo/design-system/lib/utils";
import { isProduction } from "@/lib/env";

interface LPPLayerProps {
  output_playback_id: string;
  onPlaybackStatusUpdate?: (isPlaying: boolean) => void;
}

export function LPPLayer({ output_playback_id, onPlaybackStatusUpdate }: LPPLayerProps) {
  const playerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handlePlaying = () => {
      console.log("[LPPLayer] Output video playback started");
      onPlaybackStatusUpdate?.(true);
    };

    player.addEventListener('playing', handlePlaying);
    return () => player.removeEventListener('playing', handlePlaying);
  }, [onPlaybackStatusUpdate]);

  return (
    <div className="aspect-video">
      <iframe
        src={`https://${isProduction() ? "lvpr.tv" : "monster.lvpr.tv"}/?v=${output_playback_id}&lowLatency=force&backoffMax=1000`}
        className="w-full h-full"
      />
    </div>
  );
}
