"use client";

import * as React from "react";
import { getStreamPlaybackInfo } from "@/app/api/streams/get";
import {
  PrivateErrorIcon,
  OfflineErrorIcon,
  LoadingIcon,
} from "@livepeer/react/assets";
import { getSrc } from "@livepeer/react/external";
import * as Player from "@livepeer/react/player";
import { PlaybackInfo } from "livepeer/models/components";
import { useEffect, useState } from "react";
import { isProduction } from "@/lib/env";
import { useSearchParams } from "next/navigation";

export const LivepeerPlayer = React.memo(
  ({
    output_playback_id,
    isMobile,
    stream_key,
  }: {
    output_playback_id: string;
    isMobile?: boolean;
    stream_key?: string;
  }) => {
    const [playbackInfo, setPlaybackInfo] = useState<PlaybackInfo | null>(null);
    const playerUrl = `https://ai.livepeer.${isProduction() ? "com" : "monster"}/aiWebrtc/${stream_key}-out`;

    const searchParams = useSearchParams();
    const useMediamtx = searchParams.get("useMediamtx") === "true";

    useEffect(() => {
      const fetchPlaybackInfo = async () => {
        const info = await getStreamPlaybackInfo(output_playback_id);
        setPlaybackInfo(info);
      };
      fetchPlaybackInfo();
    }, [output_playback_id]);

    const src = getSrc(useMediamtx ? playerUrl : playbackInfo);

    if (!src) {
      return (
        <div className="w-full relative h-full bg-black/50 backdrop-blur data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <LoadingIcon className="w-8 h-8 animate-spin" />
          </div>
          <PlayerLoading />
        </div>
      );
    }

    return (
      <div className={isMobile ? "w-full h-full" : "aspect-video"}>
        <Player.Root
          autoPlay
          aspectRatio={16 / 9}
          clipLength={30}
          src={src}
          jwt={null}
          backoffMax={1000}
          timeout={90000}
          lowLatency="force"
        >
          <Player.Video
            title="Live stream"
            className="h-full w-full transition-all object-contain"
          />

          <Player.LoadingIndicator className="w-full relative h-full bg-black/50 backdrop-blur data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <LoadingIcon className="w-8 h-8 animate-spin" />
            </div>
            <PlayerLoading />
          </Player.LoadingIndicator>

          <Player.ErrorIndicator
            matcher="all"
            className="absolute select-none inset-0 text-center bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <LoadingIcon className="w-8 h-8 animate-spin" />
            </div>
            <PlayerLoading />
          </Player.ErrorIndicator>

          <Player.ErrorIndicator
            matcher="offline"
            className="absolute select-none animate-in fade-in-0 inset-0 text-center bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <PlayerLoading
              title="ALMOST THERE"
              description="Please wait while we are rendering your stream"
            />
          </Player.ErrorIndicator>

          <Player.ErrorIndicator
            matcher="access-control"
            className="absolute select-none inset-0 text-center bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <PrivateErrorIcon className="h-[120px] w-full sm:flex hidden" />
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">Stream is private</div>
              <div className="text-sm text-gray-100">
                It looks like you don't have permission to view this content
              </div>
            </div>
          </Player.ErrorIndicator>
          <StateRenderer />
        </Player.Root>
      </div>
    );
  },
);

const StateRenderer = ({ __scopeMedia }: Player.MediaScopedProps) => {
  const context = Player.useMediaContext("CustomComponent", __scopeMedia);

  const state = Player.useStore(context.store);
  console.log("LivepeerPlayer:: State", state);
  return null;
};

export const PlayerLoading = ({
  title,
  description,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
}) => (
  <div className="relative w-full px-3 py-2 gap-3 flex-col-reverse flex aspect-video bg-white/10 overflow-hidden rounded-sm">
    <div className="flex justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 animate-pulse bg-white/5 overflow-hidden rounded-lg" />
        <div className="w-16 h-6 md:w-20 md:h-7 animate-pulse bg-white/5 overflow-hidden rounded-lg" />
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 animate-pulse bg-white/5 overflow-hidden rounded-lg" />
        <div className="w-6 h-6 animate-pulse bg-white/5 overflow-hidden rounded-lg" />
      </div>
    </div>
    <div className="w-full h-2 animate-pulse bg-white/5 overflow-hidden rounded-lg" />

    {title && (
      <div className="absolute flex flex-col gap-1 inset-10 text-center justify-center items-center">
        <span className="text-white text-lg font-medium">{title}</span>
        {description && (
          <span className="text-sm text-white/80">{description}</span>
        )}
      </div>
    )}
  </div>
);
