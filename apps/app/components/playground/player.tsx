"use client";

import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import React, { useEffect, useState } from "react";

import { isProduction } from "@/lib/env";
import { useSearchParams } from "next/navigation";
import { getStreamPlaybackInfo } from "@/app/api/streams/get";
import { Loader2 } from "lucide-react";
import { LoadingIcon } from "@livepeer/react/assets";
import { useMediaContext, useStore } from "@livepeer/react/player";

export const LPPLayer = React.memo(function LPPLayer({
  output_playback_id,
  isMobile,
  stream_key,
}: {
  output_playback_id: string;
  isMobile?: boolean;
  stream_key: string | null;
}) {
  // default to direct playback but allow us to disable this and go back to studio playback with an env variable or queryparam
  let playerUrl = `https://ai.livepeer.${isProduction() ? "com" : "monster"}/aiWebrtc/${stream_key}-out`;
  const searchParams = useSearchParams();
  if (
    (searchParams.get("directPlayback") !== "true" &&
      process.env.NEXT_PUBLIC_LIVEPEER_DIRECT_PLAYBACK === "false") ||
    searchParams.get("directPlayback") === "false"
  ) {
    playerUrl = `https://${isProduction() ? "lvpr.tv" : "monster.lvpr.tv"}/?v=${output_playback_id}&lowLatency=force&backoffMax=1000&ingestPlayback=true`;
  }

  console.log("LPPLayer:: PlaybackId", output_playback_id);
  const [playbackInfo, setPlaybackInfo] = useState<any>(null);

  useEffect(() => {
    const fetchPlaybackInfo = async () => {
      const { data, error } = await getStreamPlaybackInfo(output_playback_id);
      console.log("PLAYBACK INFO", data);
      setPlaybackInfo(data);
    };
    fetchPlaybackInfo();
  }, []);

  const src = getSrc(playbackInfo as any);

  if (!src) {
    console.log("LPPLayer:: No playback info found");
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p>Src is loading...</p>
      </div>
    );
  }

  console.log("LPPLayer:: Playing stream", src);
  return (
    <div className={isMobile ? "w-full h-full" : "aspect-video"}>
      {/* <iframe
        src={playerUrl}
        className="w-full h-full"
        allow="fullscreen"
        allowFullScreen
      /> */}
      <Player.Root
        src={src}
        lowLatency="force"
        ingestPlayback={true}
        backoffMax={1000}
      >
        <StateRenderer />
        <Player.Container className="flex-1 h-full w-full overflow-hidden bg-black outline-none transition-all">
          <Player.Video
            title="Live stream"
            className="h-full w-full transition-all object-cover"
          />

          <Player.LoadingIndicator
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "black",
            }}
          >
            Loading...
          </Player.LoadingIndicator>

          <Player.ErrorIndicator
            matcher="offline"
            className="absolute select-none animate-in fade-in-0 inset-0 text-center bg-black/40 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <div className="text-lg sm:text-2xl font-bold">
                  Stream is offline
                </div>
                <div className="text-xs sm:text-sm text-gray-100">
                  Playback will start automatically once the stream has started
                </div>
              </div>
              <LoadingIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto animate-spin" />
            </div>
          </Player.ErrorIndicator>

          <Player.ErrorIndicator
            matcher="access-control"
            className="absolute select-none inset-0 text-center bg-black/40 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <div className="text-lg sm:text-2xl font-bold">
                  Stream is private
                </div>
                <div className="text-xs sm:text-sm text-gray-100">
                  It looks like you don't have permission to view this content
                </div>
              </div>
              <LoadingIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto animate-spin" />
            </div>
          </Player.ErrorIndicator>
        </Player.Container>
      </Player.Root>
    </div>
  );
});

const StateRenderer = ({ __scopeMedia }: Player.MediaScopedProps) => {
  const context = useMediaContext("CustomComponent", __scopeMedia);

  const state = useStore(context.store);
  console.log("StateRenderer:: State", state);
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
