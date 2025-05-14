"use client";

import React, { useState, useEffect } from "react";
import * as Player from "@livepeer/react/player";
import { LoadingIcon } from "@livepeer/react/assets";
import { getSrc } from "@livepeer/react/external";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const PlayerLoading = ({
  title,
  description,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
}) => (
  <div className="relative h-full w-full px-3 py-2 gap-3 flex-col-reverse flex bg-white/10 overflow-hidden rounded-sm">
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

type LivepeerPlayerProps = {
  playbackId: string;
  muted?: boolean;
  autoPlay?: boolean;
  objectFit?: "cover" | "contain";
  lowLatency?: boolean | "force";
  className?: string;
  env?: "monster" | "studio";
};

export function LivepeerPlayer({
  playbackId,
  muted = true,
  autoPlay = true,
  objectFit = "contain",
  lowLatency = "force",
  className = "",
  env = "monster",
}: LivepeerPlayerProps) {
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSource(null);

    fetch(`https://livepeer.${env}/api/playback/${playbackId}`, {
      headers: {
        Authorization: "Bearer",
        "Content-Type": "application/json",
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch playback info");
        return res.json();
      })
      .then(data => {
        console.log("API Response:", data);
        const sources = getSrc(data);
        console.log("Source URLs:", sources);

        if (Array.isArray(sources) && sources.length > 0) {
          const webrtcSource = sources.find(source => source.type === "webrtc");

          if (webrtcSource && webrtcSource.src) {
            console.log("Using WebRTC source:", webrtcSource.src);
            setSource(webrtcSource.src);
          } else {
            console.log(
              "WebRTC not available, falling back to HLS:",
              sources[0].src,
            );
            setSource(sources[0].src);
          }
        } else {
          setError("Invalid source");
        }
      })
      .catch(err => {
        console.error("Error fetching playback info:", err);
        setError("Error fetching playback info");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [playbackId]);

  if (loading) {
    return <PlayerLoading />;
  }

  if (error || !source) {
    return (
      <PlayerLoading
        title={error || "Invalid source"}
        description="We could not fetch valid playback information. Please check and try again."
      />
    );
  }

  return (
    <div className={className}>
      <Player.Root
        autoPlay={autoPlay}
        volume={muted ? 0 : undefined}
        lowLatency={lowLatency}
        backoffMax={1000}
        src={source}
        aspectRatio={null}
        storage={null}
        ingestPlayback={true}
      >
        <Player.Container className="flex-1 h-full w-full overflow-hidden bg-black outline-none transition-all">
          <Player.Video
            title="Live stream"
            className={cn(
              "h-full w-full transition-all",
              objectFit === "contain" ? "object-contain" : "object-cover",
            )}
          />

          <Player.LoadingIndicator className="w-full relative h-full bg-black/50 backdrop-blur data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <LoadingIcon className="w-8 h-8 animate-spin" />
            </div>
          </Player.LoadingIndicator>

          <Player.ErrorIndicator
            matcher="all"
            className="absolute select-none inset-0 text-center bg-black/40 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <LoadingIcon className="w-8 h-8 animate-spin" />
            </div>
          </Player.ErrorIndicator>

          <Player.ErrorIndicator
            matcher="offline"
            className="absolute select-none animate-in fade-in-0 inset-0 text-center bg-black/40 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="flex flex-col gap-5">
              <LoadingIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto animate-spin" />
            </div>
          </Player.ErrorIndicator>
        </Player.Container>
      </Player.Root>
    </div>
  );
}
