"use client";

import * as React from "react";
import { getStreamPlaybackInfo } from "@/app/api/streams/get";
import {
  PrivateErrorIcon,
  LoadingIcon,
  PictureInPictureIcon,
  UnmuteIcon,
  MuteIcon,
} from "@livepeer/react/assets";
import { getSrc } from "@livepeer/react/external";
import * as Player from "@livepeer/react/player";
import { PlaybackInfo } from "livepeer/models/components";
import { useEffect, useRef, useState } from "react";
import { isProduction } from "@/lib/env";
import { useSearchParams } from "next/navigation";
import { PauseIcon, PlayIcon } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { sendKafkaEvent } from "@/app/api/metrics/kafka";
import { LPPLayer } from "@/components/playground/player";

type TrackingProps = {
  playbackId: string;
  streamId: string;
  pipelineId: string;
  pipelineType: string;
};

export const LivepeerPlayer = React.memo(
  ({
    playbackId,
    isMobile,
    stream_key,
    streamId,
    pipelineId,
    pipelineType,
  }: {
    playbackId: string;
    isMobile?: boolean;
    stream_key?: string | null;
  } & TrackingProps) => {
    const [playbackInfo, setPlaybackInfo] = useState<PlaybackInfo | null>(null);
    const playerUrl = `https://ai.livepeer.${isProduction() ? "com" : "monster"}/aiWebrtc/${stream_key}-out/whep`;

    const searchParams = useSearchParams();
    const useMediamtx =
      process.env.NEXT_PUBLIC_LIVEPEER_DIRECT_PLAYBACK !== "true" ||
      searchParams.get("useMediamtx") === "true";
    const debugMode = searchParams.get("debugMode") === "true";
    const iframePlayerFallback =
      process.env.NEXT_PUBLIC_IFRAME_PLAYER_FALLBACK === "true";

    useEffect(() => {
      if (useMediamtx || iframePlayerFallback) {
        return;
      }
      const fetchPlaybackInfo = async () => {
        const info = await getStreamPlaybackInfo(playbackId);
        setPlaybackInfo(info);
      };
      fetchPlaybackInfo();
    }, [playbackId]);

    if (iframePlayerFallback) {
      return (
        <LPPLayer
          output_playback_id={playbackId}
          stream_key={stream_key || null}
          isMobile={isMobile}
        />
      );
    }

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

          <Player.Controls
            autoHide={1000}
            className="bg-gradient-to-b gap-1 px-3 md:px-3 py-2 flex-col-reverse flex from-black/20 via-80% via-black/30 duration-1000 to-black/60 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="flex justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <Player.PlayPauseTrigger className="w-6 h-6 hover:scale-110 transition-all flex-shrink-0">
                  <Player.PlayingIndicator asChild matcher={false}>
                    <PlayIcon className="w-full h-full" />
                  </Player.PlayingIndicator>
                  <Player.PlayingIndicator asChild>
                    <PauseIcon className="w-full h-full" />
                  </Player.PlayingIndicator>
                </Player.PlayPauseTrigger>

                <Player.MuteTrigger className="w-6 h-6 hover:scale-110 transition-all flex-shrink-0">
                  <Player.VolumeIndicator asChild matcher={false}>
                    <MuteIcon className="w-full h-full" />
                  </Player.VolumeIndicator>
                  <Player.VolumeIndicator asChild matcher={true}>
                    <UnmuteIcon className="w-full h-full" />
                  </Player.VolumeIndicator>
                </Player.MuteTrigger>
                <Player.Volume className="relative mr-1 flex-1 group flex cursor-pointer items-center select-none touch-none max-w-[120px] h-5">
                  <Player.Track className="bg-white/30 relative grow rounded-full transition-all h-[2px] md:h-[3px] group-hover:h-[3px] group-hover:md:h-[4px]">
                    <Player.Range className="absolute bg-white rounded-full h-full" />
                  </Player.Track>
                  <Player.Thumb className="block transition-all group-hover:scale-110 w-3 h-3 bg-white rounded-full" />
                </Player.Volume>
              </div>
              <div className="flex sm:flex-1 md:flex-[1.5] justify-end items-center gap-2.5">
                <Player.PictureInPictureTrigger className="w-6 h-6 hover:scale-110 transition-all flex-shrink-0">
                  <PictureInPictureIcon className="w-full h-full" />
                </Player.PictureInPictureTrigger>
              </div>
            </div>
          </Player.Controls>

          <DebugTimer
            debugMode={debugMode}
            playbackId={playbackId}
            streamId={streamId}
            pipelineId={pipelineId}
            pipelineType={pipelineType}
          />
        </Player.Root>
      </div>
    );
  },
);

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

const useFirstFrameLoaded = ({
  __scopeMedia,
  playbackId,
  streamId,
  pipelineType,
  pipelineId,
}: Player.MediaScopedProps & TrackingProps) => {
  const { user } = usePrivy();
  const startTime = useRef(Date.now());
  const [firstFrameTime, setFirstFrameTime] = useState<string | null>(null);
  const context = Player.useMediaContext("CustomComponent", __scopeMedia);
  const state = Player.useStore(context.store);

  // Send event on load
  useEffect(() => {
    const sendEvent = async () =>
      await sendKafkaEvent(
        "stream_trace",
        {
          type: "app_send_stream_request",
          timestamp: startTime.current,
          user_id: user?.id || "anonymous",
          playback_id: playbackId,
          stream_id: streamId,
          pipeline: pipelineType,
          pipeline_id: pipelineId,
          // TODO: Get viewer info from client
          viewer_info: {
            ip: "",
            user_agent: "",
            country: "",
            city: "",
          },
        },
        "daydream",
        "server",
      );
    sendEvent();
  }, []);

  // Send event when the firstFrameIsLoaded
  useEffect(() => {
    if (state.hasPlayed && !firstFrameTime) {
      const currentTime = Date.now();
      setFirstFrameTime(((currentTime - startTime.current) / 1000).toFixed(2));

      const sendEvent = async () =>
        await sendKafkaEvent(
          "stream_trace",
          {
            type: "app_receive_first_segment",
            timestamp: Date.now(),
            user_id: user?.id || "anonymous",
            playback_id: playbackId,
            stream_id: streamId,
            pipeline: pipelineType,
            pipeline_id: pipelineId,
            // TODO: Get viewer info from client
            viewer_info: {
              ip: "",
              user_agent: "",
              country: "",
              city: "",
            },
          },
          "daydream",
          "server",
        );
      sendEvent();
    }
  }, [state.hasPlayed]);

  return firstFrameTime;
};

const DebugTimer = (
  props: Player.MediaScopedProps & TrackingProps & { debugMode: boolean },
) => {
  const firstFrameTime = useFirstFrameLoaded(props);

  if (!props.debugMode || !firstFrameTime) {
    return null;
  }

  return (
    <div className="absolute bottom-12 left-4 flex items-center gap-1">
      <p className="text-xs text-white/50">First Frame Loaded in:</p>
      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
      <span className="text-xs text-blue-400">{firstFrameTime}s</span>
    </div>
  );
};
