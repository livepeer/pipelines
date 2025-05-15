"use client";

import { sendKafkaEvent } from "@/lib/analytics/event-middleware";
import { getStreamPlaybackInfo } from "@/app/api/streams/get";
import { LPPLayer } from "@/components/playground/player";
import { useAppConfig } from "@/hooks/useAppConfig";
import { useDreamshaperStore } from "@/hooks/useDreamshaper";
import { useFallbackDetection } from "@/hooks/useFallbackDetection";
import useFullscreenStore from "@/hooks/useFullscreenStore";
import useMobileStore from "@/hooks/useMobileStore";
import { usePrivy } from "@/hooks/usePrivy";
import {
  EnterFullscreenIcon,
  ExitFullscreenIcon,
  LoadingIcon,
  MuteIcon,
  PrivateErrorIcon,
  UnmuteIcon,
} from "@livepeer/react/assets";
import { getSrc } from "@livepeer/react/external";
import * as Player from "@livepeer/react/player";
import { PlaybackInfo } from "livepeer/models/components";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { usePlaybackUrlStore } from "@/hooks/usePlaybackUrlStore";

const VideoJSPlayer = dynamic(() => import("./videojs-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full relative h-full bg-black/50 backdrop-blur">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <LoadingIcon className="w-8 h-8 animate-spin" />
      </div>
      <PlayerLoading />
    </div>
  ),
});

interface PlayerState {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
}

export const usePlayerStore = create<PlayerState>(set => ({
  isPlaying: false,
  setIsPlaying: (value: boolean) => set({ isPlaying: value }),
}));

const initialDelay = 3000;
const linearPhaseDelay = 100;
const linearPhaseEndCount = 50;

const calculateDelay = (count: number): number => {
  const baseExponentialDelay = 200;
  const maxExponentialDelay = 60 * 1000;
  const exponentFactor = 2;

  if (count === 0) {
    return initialDelay;
  }

  if (count > 0 && count <= linearPhaseEndCount) {
    return linearPhaseDelay;
  }

  const exponentialAttemptNumber = count - linearPhaseEndCount;

  const delay =
    baseExponentialDelay *
    Math.pow(exponentFactor, exponentialAttemptNumber - 1);

  return Math.min(delay, maxExponentialDelay);
};

export const LivepeerPlayer = () => {
  const { stream, pipeline } = useDreamshaperStore();
  const { isMobile } = useMobileStore();
  const appConfig = useAppConfig();
  const { isFullscreen } = useFullscreenStore();
  const { setIsPlaying } = usePlayerStore();
  const [playbackInfo, setPlaybackInfo] = useState<PlaybackInfo | null>(null);
  const { playbackUrl, setPlaybackUrl, setLoading, loading } =
    usePlaybackUrlStore();

  const { useFallbackPlayer: useFallbackVideoJSPlayer, handleError } =
    useFallbackDetection(stream?.output_playback_id!);

  useEffect(() => {
    setIsPlaying(false);
    setLoading(true);

    return () => {
      setPlaybackUrl(null);
      setLoading(false);
    };
  }, []);

  const searchParams = useSearchParams();
  const useMediamtx =
    process.env.NEXT_PUBLIC_LIVEPEER_DIRECT_PLAYBACK !== "true" ||
    searchParams.get("useMediamtx") === "true";
  const debugMode = searchParams.get("debugMode") === "true";
  const iframePlayerFallback =
    process.env.NEXT_PUBLIC_IFRAME_PLAYER_FALLBACK === "true";
  const useVideoJS =
    searchParams.get("videoJS") === "true" || useFallbackVideoJSPlayer;

  useEffect(() => {
    if (useMediamtx || iframePlayerFallback || useVideoJS) {
      return;
    }
    const fetchPlaybackInfo = async () => {
      const info = await getStreamPlaybackInfo(stream?.output_playback_id!);
      setPlaybackInfo(info);
    };
    fetchPlaybackInfo();
  }, [
    useMediamtx,
    iframePlayerFallback,
    useVideoJS,
    stream?.output_playback_id,
  ]);

  if (loading) {
    return <PlayerLoading />;
  }

  const playbackUrlWithFallback =
    playbackUrl ||
    `${appConfig.whipUrl}${appConfig?.whipUrl?.endsWith("/") ? "" : "/"}${stream?.stream_key}-out/whep`;

  if (iframePlayerFallback) {
    return (
      <LPPLayer
        output_playback_id={stream?.output_playback_id!}
        stream_key={stream?.stream_key || null}
        isMobile={isMobile}
      />
    );
  }

  if (useVideoJS && pipeline) {
    return (
      <VideoJSPlayer
        src={playbackUrlWithFallback}
        isMobile={isMobile}
        playbackId={stream?.output_playback_id!}
        streamId={stream?.id!}
        pipelineId={pipeline?.id!}
        pipelineType={pipeline?.type!}
      />
    );
  }

  const src = getSrc(useMediamtx ? playbackUrlWithFallback : playbackInfo);

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
    <div className={isMobile ? "w-full h-full" : "h-full w-full"}>
      <Player.Root
        autoPlay
        aspectRatio={16 / 9}
        clipLength={30}
        src={src}
        jwt={null}
        calculateDelay={calculateDelay}
        timeout={300000}
        lowLatency="force"
        {...({
          iceServers: {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun.cloudflare.com:3478",
            ],
          },
        } as any)}
        onError={handleError}
      >
        <div
          className="absolute inset-0 z-[5]"
          onClick={e => e.stopPropagation()}
        ></div>

        <Player.Video
          title="Live stream"
          data-testid="playback-video"
          className={`h-full w-full transition-all object-contain relative z-0 ${!isMobile ? "-scale-x-100" : ""} bg-[#fefefe]`}
          onLoadedMetadata={() => {
            setIsPlaying(true);
          }}
        />

        <Player.LoadingIndicator className="w-full relative h-full bg-black/50 backdrop-blur data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0 z-[6]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <LoadingIcon className="w-8 h-8 animate-spin" />
          </div>
          <PlayerLoading />
        </Player.LoadingIndicator>

        <Player.ErrorIndicator
          matcher="all"
          className="absolute select-none inset-0 text-center bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0 z-[6]"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <LoadingIcon className="w-8 h-8 animate-spin" />
          </div>
          <PlayerLoading />
        </Player.ErrorIndicator>

        <Player.ErrorIndicator
          matcher="offline"
          className="absolute select-none animate-in fade-in-0 inset-0 text-center bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0 z-[6]"
        >
          <PlayerLoading
            title="ALMOST THERE"
            description="Please wait while we are rendering your stream"
          />
        </Player.ErrorIndicator>

        <Player.ErrorIndicator
          matcher="access-control"
          className="absolute select-none inset-0 text-center bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0 z-[6]"
        >
          <PrivateErrorIcon className="h-[120px] w-full sm:flex hidden" />
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">Stream is private</div>
            <div className="text-sm text-gray-100">
              It looks like you don&apos;t have permission to view this content
            </div>
          </div>
        </Player.ErrorIndicator>

        <Player.Controls
          autoHide={1000}
          className={
            isFullscreen
              ? "hidden"
              : "bg-gradient-to-b gap-1 px-3 md:px-3 py-2 flex-col-reverse flex from-black/20 via-80% via-black/30 duration-1000 to-black/60 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0 relative z-[10]"
          }
        >
          <div className="flex justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Player.MuteTrigger className="w-6 h-6 hover:scale-110 transition-all flex-shrink-0">
                <Player.VolumeIndicator asChild matcher={false}>
                  <MuteIcon className="w-full h-full text-white" />
                </Player.VolumeIndicator>
                <Player.VolumeIndicator asChild matcher={true}>
                  <UnmuteIcon className="w-full h-full text-white" />
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
              <Player.FullscreenTrigger className="w-6 h-6 hover:scale-110 transition-all flex-shrink-0">
                <Player.FullscreenIndicator asChild>
                  <ExitFullscreenIcon className="w-full h-full text-white" />
                </Player.FullscreenIndicator>
                <Player.FullscreenIndicator matcher={false} asChild>
                  <EnterFullscreenIcon className="w-full h-full text-white" />
                </Player.FullscreenIndicator>
              </Player.FullscreenTrigger>
            </div>
          </div>
        </Player.Controls>

        <DebugTimer debugMode={debugMode} />
      </Player.Root>
    </div>
  );
};

LivepeerPlayer.displayName = "LivepeerPlayer";

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

const useFirstFrameLoaded = ({ __scopeMedia }: Player.MediaScopedProps) => {
  const { user } = usePrivy();
  const { stream, pipeline } = useDreamshaperStore();
  const startTime = useRef(Date.now());
  const [firstFrameTime, setFirstFrameTime] = useState<string | null>(null);
  const context = Player.useMediaContext("CustomComponent", __scopeMedia);
  const state = Player.useStore(context.store);

  // Send event on load
  useEffect(() => {
    const sendEvent = async () => {
      await sendKafkaEvent(
        "stream_trace",
        {
          type: "app_send_stream_request",
          playback_id: stream?.output_playback_id,
          stream_id: stream?.id,
          pipeline: pipeline?.type,
          pipeline_id: pipeline?.id,
          player: "livepeer",
        },
        "daydream",
        "server",
        user || undefined,
      );
    };
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
            playback_id: stream?.output_playback_id,
            stream_id: stream?.id,
            pipeline: pipeline?.type,
            pipeline_id: pipeline?.id,
            player: "livepeer",
          },
          "daydream",
          "server",
          user || undefined,
        );
      sendEvent();
    }
  }, [state.hasPlayed]);

  return firstFrameTime;
};

const DebugTimer = (
  props: Player.MediaScopedProps & { debugMode: boolean },
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
