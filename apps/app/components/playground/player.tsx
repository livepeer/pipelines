"use client";

import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import React, { useEffect, useState } from "react";

import { isProduction } from "@/lib/env";
import { useSearchParams } from "next/navigation";
import { getStreamPlaybackInfo } from "@/app/api/streams/get";
import { Loader2 } from "lucide-react";

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
        src={src.filter(s => s.type !== "hls")}
        lowLatency="force"
        ingestPlayback={true}
        backoffMax={1000}
      >
        <Player.Container className="flex-1 h-full w-full overflow-hidden bg-black outline-none transition-all">
          <Player.Video
            title="Live stream"
            className="h-full w-full transition-all object-"
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
        </Player.Container>
      </Player.Root>
    </div>
  );
}
