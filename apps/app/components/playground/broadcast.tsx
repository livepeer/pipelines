import {
  DisableVideoIcon,
  EnableVideoIcon,
  LoadingIcon,
  OfflineErrorIcon,
  PictureInPictureIcon,
  SettingsIcon,
  StartScreenshareIcon,
  StopScreenshareIcon,
} from "@livepeer/react/assets";
import * as Broadcast from "@livepeer/react/broadcast";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@repo/design-system/lib/utils";
import {
  Camera,
  CheckIcon,
  ChevronDownIcon,
  Maximize,
  Minimize2,
  SwitchCamera,
  XIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { sendKafkaEvent } from "@/app/api/metrics/kafka";
import { useDreamshaperStore } from "@/hooks/useDreamshaper";
import { create } from "zustand";
import { usePrivy } from "@/hooks/usePrivy";
import useMobileStore from "@/hooks/useMobileStore";

const StatusMonitor = () => {
  const { user } = usePrivy();
  const { stream, pipeline } = useDreamshaperStore();
  const liveEventSentRef = useRef(false);
  const context = Broadcast.useBroadcastContext("StatusMonitor", undefined);
  const state = Broadcast.useStore(context.store, state => state);

  useEffect(() => {
    if (!stream?.id || !pipeline?.id || !pipeline?.type) return;

    if (state.status === "live" && !liveEventSentRef.current) {
      liveEventSentRef.current = true;

      const sendEvent = async () => {
        await sendKafkaEvent(
          "stream_trace",
          {
            type: "app_start_broadcast_stream",
            timestamp: Date.now(),
            user_id: user?.id || "anonymous",
            playback_id: "",
            stream_id: stream.id,
            pipeline: pipeline.type,
            pipeline_id: pipeline.id,
            hostname: window.location.hostname,
            broadcaster_info: {
              ip: "",
              user_agent: navigator.userAgent,
              country: "",
              city: "",
            },
          },
          "daydream",
          "server",
        );
      };

      sendEvent();
    } else if (state.status !== "live") {
      liveEventSentRef.current = false;
    }
  }, [state.status, stream?.id, pipeline?.id, pipeline?.type, user?.id]);

  return null;
};

interface BroadcastUIStore {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
}

export const useBroadcastUIStore = create<BroadcastUIStore>(set => ({
  collapsed: false,
  setCollapsed: value => set({ collapsed: value }),
  toggleCollapsed: () => set(state => ({ collapsed: !state.collapsed })),
}));

const videoId = "live-video";

export function BroadcastWithControls({ className }: { className?: string }) {
  const { streamUrl: ingestUrl } = useDreamshaperStore();
  const [isPiP, setIsPiP] = useState(false);

  const { collapsed, setCollapsed, toggleCollapsed } = useBroadcastUIStore();
  const { isMobile } = useMobileStore();

  useEffect(() => {
    const videoEl = document.getElementById(videoId) as HTMLVideoElement | null;
    if (!videoEl) return;

    const onEnterPiP = () => {
      setIsPiP(true);
    };

    const onLeavePiP = () => {
      setIsPiP(false);
    };

    videoEl.addEventListener("enterpictureinpicture", onEnterPiP);
    videoEl.addEventListener("leavepictureinpicture", onLeavePiP);

    return () => {
      videoEl.removeEventListener("enterpictureinpicture", onEnterPiP);
      videoEl.removeEventListener("leavepictureinpicture", onLeavePiP);
    };
  }, []);

  if (!ingestUrl) {
    return (
      <BroadcastLoading
        title="Invalid stream key"
        description="The stream key provided was invalid. Please check and try again."
      />
    );
  }

  return (
    <Broadcast.Root
      onError={error => {
        return error?.type === "permissions"
          ? toast.error(
              "You must accept permissions to broadcast. Please try again.",
            )
          : null;
      }}
      forceEnabled
      mirrored
      video
      audio={false}
      aspectRatio={16 / 9}
      ingestUrl={ingestUrl}
      iceServers={{
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:global.stun.twilio.com:3478",
          "stun:stun.cloudflare.com:3478",
          "stun:stun.services.mozilla.com:3478",
        ],
      }}
      storage={null}
    >
      <StatusMonitor />

      <Broadcast.Container
        id={videoId}
        className={cn(
          "text-white/50 overflow-visible rounded-sm bg-transparent border-0 relative",
          className,
          isPiP ? "hidden" : "",
          !collapsed
            ? "w-full h-full"
            : isMobile
              ? "!w-full !h-12 bg-muted-background rounded-2xl"
              : "!w-12 !h-12 rounded-full",
        )}
        style={collapsed && !isMobile ? { width: "3rem", height: "3rem" } : {}}
        onClick={e => collapsed && e.stopPropagation()}
      >
        <Broadcast.Video
          title="Live stream"
          className={cn("w-full h-full object-cover", collapsed && "opacity-0")}
        />

        {collapsed ? (
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              toggleCollapsed();
            }}
            className={cn(
              "flex items-center cursor-pointer absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 shadow-[4px_12px_16px_0px_#37373F40]",
              isMobile
                ? "w-full h-12 pl-2 pr-4 bg-grey-700 rounded-2xl justify-between bg-muted-foreground/10"
                : "w-full h-full",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full",
                  isMobile
                    ? "px-4 py-2 bg-[linear-gradient(120.63deg,rgba(0,0,0,0.08)_31.4%,rgba(130,130,130,0.08)_85.12%)]"
                    : "p-2 bg-[linear-gradient(120.63deg,rgba(0,0,0,0.1)_31.4%,rgba(0,0,0,0.05)_85.12%)] border-white/20 border",
                )}
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1.5" />
                <Camera className="w-4 h-4 text-zinc-700" />
              </div>
              {isMobile && (
                <span className="text-sm text-foreground font-medium">
                  Input Video
                </span>
              )}
            </div>
            {isMobile && (
              <div className="flex items-center gap-3">
                <CameraSwitchButton />
                <div className="w-[1px] h-4 bg-black/10" />
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCollapsed();
                  }}
                  className="p-1"
                >
                  <Maximize className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            )}
          </button>
        ) : (
          <>
            <div
              className="absolute top-2 right-2 z-50 block"
              style={{ pointerEvents: "auto" }}
            >
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCollapsed(true);
                }}
                className="p-2 hover:scale-110 transition cursor-pointer"
                aria-label="Collapse stream"
              >
                <Minimize2 className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <Broadcast.LoadingIndicator className="w-full relative h-full">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <LoadingIcon className="w-8 h-8 animate-spin" />
              </div>
              <BroadcastLoading />
            </Broadcast.LoadingIndicator>
            <Broadcast.ErrorIndicator
              matcher="not-permissions"
              className={cn(
                "absolute select-none inset-0 text-center bg-gray-950 flex flex-col items-center justify-center gap-4 duration-1000 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0",
                collapsed && "opacity-0",
              )}
            >
              <OfflineErrorIcon className="h-[120px] w-full sm:flex hidden" />
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold">Broadcast failed</div>
                <div className="text-sm text-gray-100">
                  There was an error with broadcasting - it is retrying in the
                  background.
                </div>
              </div>
            </Broadcast.ErrorIndicator>
            <Broadcast.Controls
              className={cn(
                "bg-gradient-to-b gap-1 px-3 md:px-3 py-1.5 flex-col-reverse flex from-black/20 via-80% via-black/30 to-black/60",
                collapsed && "opacity-0",
              )}
            >
              <div className="flex justify-between gap-4">
                <div className="flex flex-1 items-center gap-3">
                  <Broadcast.VideoEnabledTrigger className="w-6 h-6 hover:scale-110 transition flex-shrink-0">
                    <Broadcast.VideoEnabledIndicator asChild matcher={false}>
                      <DisableVideoIcon className="w-full h-full text-white/50" />
                    </Broadcast.VideoEnabledIndicator>
                    <Broadcast.VideoEnabledIndicator asChild matcher={true}>
                      <EnableVideoIcon className="w-full h-full text-white/50" />
                    </Broadcast.VideoEnabledIndicator>
                  </Broadcast.VideoEnabledTrigger>
                </div>
                <div className="flex sm:flex-1 md:flex-[1.5] justify-end items-center gap-2.5">
                  <CameraSwitchButton />

                  <Broadcast.ScreenshareTrigger className="w-6 h-6 hover:scale-110 transition flex-shrink-0">
                    <Broadcast.ScreenshareIndicator asChild>
                      <StopScreenshareIcon className="w-full h-full text-white/50" />
                    </Broadcast.ScreenshareIndicator>

                    <Broadcast.ScreenshareIndicator matcher={false} asChild>
                      <StartScreenshareIcon className="w-full h-full text-white/50" />
                    </Broadcast.ScreenshareIndicator>
                  </Broadcast.ScreenshareTrigger>

                  <Broadcast.PictureInPictureTrigger className="w-6 h-6 hover:scale-110 transition flex-shrink-0">
                    <PictureInPictureIcon className="w-full h-full text-white/50" />
                  </Broadcast.PictureInPictureTrigger>
                </div>
              </div>
            </Broadcast.Controls>

            <Broadcast.LoadingIndicator asChild matcher={false}>
              <div
                className={cn(
                  "absolute overflow-hidden py-1 px-2 rounded-full top-1 left-1 bg-black/50 flex items-center backdrop-blur",
                  collapsed && "opacity-0",
                )}
              >
                <Broadcast.StatusIndicator
                  matcher="live"
                  className="flex gap-2 items-center"
                >
                  <div className="bg-red-500 animate-pulse h-1.5 w-1.5 rounded-full" />
                  <span className="text-xs select-none">LIVE</span>
                </Broadcast.StatusIndicator>

                <Broadcast.StatusIndicator
                  className="flex gap-2 items-center"
                  matcher="pending"
                >
                  <div className="bg-white/80 h-1.5 w-1.5 rounded-full animate-pulse" />
                  <span className="text-xs select-none">PENDING</span>
                </Broadcast.StatusIndicator>

                <Broadcast.StatusIndicator
                  className="flex gap-2 items-center"
                  matcher="idle"
                >
                  <div className="bg-white/80 h-1.5 w-1.5 rounded-full" />
                  <span className="text-xs select-none">IDLE</span>
                </Broadcast.StatusIndicator>
              </div>
            </Broadcast.LoadingIndicator>
          </>
        )}
      </Broadcast.Container>
    </Broadcast.Root>
  );
}

const CameraSwitchButton = () => {
  const context = Broadcast.useBroadcastContext("CurrentSource", undefined);
  const state = Broadcast.useStore(context.store, state => state);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [showCameraModal, setShowCameraModal] = useState(false);

  useEffect(() => {
    if (state.video) {
      state.__controlsFunctions.requestDeviceListInfo();
    }
  }, [state.video]);

  const videoDevices = state.mediaDevices?.filter(
    device => device.kind === "videoinput",
  );

  if (!videoDevices?.length) {
    return null;
  }

  const currentCameraId = state.mediaDeviceIds.videoinput;
  const currentIndex = videoDevices.findIndex(
    d => d.deviceId === currentCameraId,
  );

  const handleSelectCamera = async (deviceId: string) => {
    try {
      setShowCameraModal(false);

      const originalStream = state.mediaStream;
      const originalTracks = originalStream?.getVideoTracks() || [];
      const originalSettings = originalTracks[0]?.getSettings();

      const originalConstraints = {
        deviceId: originalSettings?.deviceId || currentCameraId,
      };

      state.mediaStream?.getTracks().forEach(track => track.stop());

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { ideal: deviceId } },
        });

        state.__controlsFunctions.updateMediaStream(newStream);
      } catch (err) {
        console.error("Failed to switch to selected camera:", err);

        try {
          const recoveryStream = await navigator.mediaDevices.getUserMedia({
            video: originalConstraints,
          });

          state.__controlsFunctions.updateMediaStream(recoveryStream);
        } catch (recoveryErr) {
          console.error("Failed to restore original camera:", recoveryErr);

          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            state.__controlsFunctions.updateMediaStream(fallbackStream);
          } catch (fallbackErr) {
            console.error("All camera recovery attempts failed:", fallbackErr);
          }
        }
      }
    } catch (err) {
      console.error("Error during camera selection:", err);
      toast.error("Failed to switch camera");
    }
  };

  return (
    <>
      <button
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();

          if (isMobile) {
            setShowCameraModal(true);
          } else {
            const nextIndex =
              currentIndex === -1
                ? 0
                : (currentIndex + 1) % videoDevices.length;
            const nextCameraId = videoDevices[nextIndex]?.deviceId;

            if (nextCameraId) {
              state.__controlsFunctions.requestMediaDeviceId(
                nextCameraId as any,
                "videoinput",
              );
            }
          }
        }}
        className="w-6 h-6 hover:scale-110 transition flex-shrink-0"
      >
        <SwitchCamera className="w-full h-full text-muted-foreground" />
      </button>

      {showCameraModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
            onClick={() => setShowCameraModal(false)}
          >
            <div
              className="bg-gray-900 rounded-lg p-4 w-[90%] max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-medium">
                  Select Camera
                </h3>
                <button
                  onClick={() => setShowCameraModal(false)}
                  className="text-white/50"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {videoDevices.map(device => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleSelectCamera(device.deviceId)}
                    className={cn(
                      "text-left px-3 py-2 rounded hover:bg-white/10 flex items-center gap-2",
                      device.deviceId === currentCameraId ? "bg-white/20" : "",
                    )}
                  >
                    <Camera className="w-4 h-4 text-white/50" />
                    <span className="text-white text-sm">
                      {device.label ||
                        `Camera ${videoDevices.indexOf(device) + 1}`}
                    </span>
                    {device.deviceId === currentCameraId && (
                      <CheckIcon className="w-4 h-4 text-white ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export const BroadcastLoading = ({
  title,
  description,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
}) => (
  <div className="relative w-full px-3 md:px-3 py-3 gap-3 flex-col-reverse flex aspect-video bg-white/10 overflow-hidden rounded-sm">
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

export const Settings = React.forwardRef(
  (
    { className }: { className?: string },
    ref: React.Ref<HTMLButtonElement> | undefined,
  ) => {
    return (
      <Popover.Root>
        <Popover.Trigger ref={ref} asChild>
          <button
            type="button"
            className={className}
            aria-label="Stream settings"
            onClick={e => e.stopPropagation()}
          >
            <SettingsIcon />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="w-60 rounded-md bg-black/50 border border-white/50 backdrop-blur-md p-3 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            side="top"
            alignOffset={-70}
            align="end"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <p className="text-white/90 font-medium text-sm mb-1">
                Stream settings
              </p>

              <div className="gap-2 flex-col flex">
                <label
                  className="text-xs text-white/90 font-medium"
                  htmlFor="cameraSource"
                >
                  Camera (&apos;c&apos; to rotate)
                </label>
                <SourceSelectComposed name="cameraSource" type="videoinput" />
              </div>
            </div>
            <Popover.Close
              className="rounded-full h-5 w-5 inline-flex items-center justify-center absolute top-2.5 right-2.5 outline-none"
              aria-label="Close"
            >
              <XIcon />
            </Popover.Close>
            <Popover.Arrow className="fill-white/50" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  },
);

Settings.displayName = "Settings";

export const SourceSelectComposed = React.forwardRef(
  (
    {
      name,
      type,
      className,
    }: { name: string; type: "audioinput" | "videoinput"; className?: string },
    ref: React.Ref<HTMLButtonElement> | undefined,
  ) => (
    <Broadcast.SourceSelect name={name} type={type}>
      {devices =>
        devices ? (
          <>
            <Broadcast.SelectTrigger
              ref={ref}
              className={cn(
                "flex w-full items-center overflow-hidden justify-between rounded-sm px-1 outline-1 outline-white/50 text-xs leading-none h-7 gap-1 outline-none disabled:opacity-70 disabled:cursor-not-allowed",
                className,
              )}
              aria-label={type === "audioinput" ? "Audio input" : "Video input"}
            >
              <Broadcast.SelectValue
                placeholder={
                  type === "audioinput"
                    ? "Select an audio input"
                    : "Select a video input"
                }
              />
              <Broadcast.SelectIcon>
                <ChevronDownIcon className="h-4 w-4" />
              </Broadcast.SelectIcon>
            </Broadcast.SelectTrigger>
            <Broadcast.SelectPortal>
              <Broadcast.SelectContent className="overflow-hidden bg-black rounded-sm">
                <Broadcast.SelectViewport className="p-1">
                  <Broadcast.SelectGroup>
                    {devices?.map(device => (
                      <RateSelectItem
                        key={device.deviceId}
                        value={device.deviceId}
                      >
                        {device.friendlyName}
                      </RateSelectItem>
                    ))}
                  </Broadcast.SelectGroup>
                </Broadcast.SelectViewport>
              </Broadcast.SelectContent>
            </Broadcast.SelectPortal>
          </>
        ) : (
          <span>There was an error fetching the available devices.</span>
        )
      }
    </Broadcast.SourceSelect>
  ),
);

SourceSelectComposed.displayName = "SourceSelectComposed";

const RateSelectItem = React.forwardRef<
  HTMLDivElement,
  Broadcast.SelectItemProps
>(({ children, className, ...props }, forwardedRef) => {
  return (
    <Broadcast.SelectItem
      className={cn(
        "text-xs leading-none rounded-sm flex items-center h-7 pr-[35px] pl-[25px] relative select-none data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-white/20",
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      <Broadcast.SelectItemText>{children}</Broadcast.SelectItemText>
      <Broadcast.SelectItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
        <CheckIcon className="w-4 h-4" />
      </Broadcast.SelectItemIndicator>
    </Broadcast.SelectItem>
  );
});

RateSelectItem.displayName = "RateSelectItem";
