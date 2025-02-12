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

export function LPPLayer({
  output_playback_id,
}: {
  output_playback_id: string;
}) {
  return (
    <div className="aspect-video">
      <iframe
        src={`https://${isProduction() ? "lvpr.tv" : "monster.lvpr.tv"}/?v=${output_playback_id}&lowLatency=force&backoffMax=1000&ingestPlayback=true`}
        className="w-full h-full"
      />
    </div>
  );
}
