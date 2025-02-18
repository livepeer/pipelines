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
import React, { useCallback, useTransition } from "react";
import { toast } from "sonner";

import { Src } from "@livepeer/react";
import { cn } from "@repo/design-system/lib/utils";
import { isProduction } from "@/lib/env";
import { useSearchParams } from "next/navigation";

export function LPPLayer({
  output_playback_id,
  isMobile,
  stream_key,
}: {
  output_playback_id: string;
  isMobile?: boolean;
  stream_key: string | null;
}) {
  const searchParams = useSearchParams();
  let playerUrl = `https://${isProduction() ? "lvpr.tv" : "monster.lvpr.tv"}/?v=${output_playback_id}&lowLatency=force&backoffMax=1000&ingestPlayback=true`
  if (searchParams.get("directPlayback") === "true") {
    playerUrl = `https://ai.livepeer.${isProduction() ? "com" : "monster"}/aiWebrtc/${stream_key}-out`
  }
  return (
    <div className={isMobile ? "w-full h-full" : "aspect-video"}>
      <iframe
        src={playerUrl}
        className="w-full h-full"
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
}
