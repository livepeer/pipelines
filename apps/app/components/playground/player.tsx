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
import { getSrc } from "@livepeer/react/external";
import Livepeer from "livepeer";

import { Src } from "@livepeer/react";
import { cn } from "@repo/design-system/lib/utils";
import { isProduction } from "@/lib/env";
import { useSearchParams } from "next/navigation";

// const livepeer = new Livepeer({
//   apiKey: process.env.YOUR_PRIVATE_API_KEY,
// });

export function LPPLayer({
  output_playback_id,
  isMobile,
  stream_key,
}: {
  output_playback_id: string;
  isMobile?: boolean;
  stream_key: string | null;
}) {
  // default to direct playback but allow us to disable this and go back to studio playback with an env variable or queryparam
  let src = getSrc(`https://ai.livepeer.${isProduction() ? "com" : "monster"}/aiWebrtc/${stream_key}-out/whep`)
  const searchParams = useSearchParams();
  if (
    (searchParams.get("directPlayback") !== "true" &&
      process.env.NEXT_PUBLIC_LIVEPEER_DIRECT_PLAYBACK === "false") ||
    searchParams.get("directPlayback") === "false"
  ) {
    // const playbackInfo = await livepeer.playback.get(output_playback_id);
    // src = getSrc(playbackInfo.playbackInfo);
  }
  return (
    <Player.Root src={src} autoPlay={true}>
      <Player.Container>
        <Player.Video title="Live stream" />

        <Player.Controls className="flex items-center justify-center">
          <Player.PlayPauseTrigger className="w-10 h-10">
            <Player.PlayingIndicator asChild matcher={false}>
              <PlayIcon />
            </Player.PlayingIndicator>
            <Player.PlayingIndicator asChild>
              <PauseIcon />
            </Player.PlayingIndicator>
          </Player.PlayPauseTrigger>
        </Player.Controls>
      </Player.Container>
    </Player.Root>
  );
}
