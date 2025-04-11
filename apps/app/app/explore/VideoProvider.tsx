"use client";

import { createContext, useContext, useMemo, useReducer, useRef } from "react";

interface Video {
  id: number;
  title: string;
  published: Date;
  description: string;
  src: string;
  thumbnail: string;
}

interface PlayerState {
  playing: boolean;
  muted: boolean;
  duration: number;
  currentTime: number;
  video: Video | null;
  fullscreen: boolean;
  volume: number;
}

interface PublicPlayerActions {
  play: (video?: Video) => void;
  pause: () => void;
  toggle: (video?: Video) => void;
  seekBy: (amount: number) => void;
  seek: (time: number) => void;
  playbackRate: (rate: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setVolume: (volume: number) => void;
  isPlaying: (video?: Video) => boolean;
}

export type PlayerAPI = PlayerState & PublicPlayerActions;

const enum ActionKind {
  SET_META = "SET_META",
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  TOGGLE_MUTE = "TOGGLE_MUTE",
  TOGGLE_FULLSCREEN = "TOGGLE_FULLSCREEN",
  SET_CURRENT_TIME = "SET_CURRENT_TIME",
  SET_DURATION = "SET_DURATION",
  SET_VOLUME = "SET_VOLUME",
}

type Action =
  | { type: ActionKind.SET_META; payload: Video }
  | { type: ActionKind.PLAY }
  | { type: ActionKind.PAUSE }
  | { type: ActionKind.TOGGLE_MUTE }
  | { type: ActionKind.TOGGLE_FULLSCREEN }
  | { type: ActionKind.SET_CURRENT_TIME; payload: number }
  | { type: ActionKind.SET_DURATION; payload: number }
  | { type: ActionKind.SET_VOLUME; payload: number };

const VideoPlayerContext = createContext<PlayerAPI | null>(null);

function videoReducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case ActionKind.SET_META:
      return { ...state, video: action.payload };
    case ActionKind.PLAY:
      return { ...state, playing: true };
    case ActionKind.PAUSE:
      return { ...state, playing: false };
    case ActionKind.TOGGLE_MUTE:
      return { ...state, muted: !state.muted };
    case ActionKind.TOGGLE_FULLSCREEN:
      return { ...state, fullscreen: !state.fullscreen };
    case ActionKind.SET_CURRENT_TIME:
      return { ...state, currentTime: action.payload };
    case ActionKind.SET_DURATION:
      return { ...state, duration: action.payload };
    case ActionKind.SET_VOLUME:
      return { ...state, volume: action.payload };
  }
}

export function VideoProvider({
  children,
  src,
}: {
  children: React.ReactNode;
  src: string;
}) {
  const [state, dispatch] = useReducer(videoReducer, {
    playing: false,
    muted: true,
    duration: 0,
    currentTime: 0,
    video: null,
    fullscreen: false,
    volume: 1,
  });
  const playerRef = useRef<React.ElementRef<"video">>(null);

  const actions = useMemo<PublicPlayerActions>(() => {
    return {
      play(video) {
        if (video) {
          dispatch({ type: ActionKind.SET_META, payload: video });

          if (playerRef.current && playerRef.current.currentSrc !== video.src) {
            let playbackRate = playerRef.current.playbackRate;
            playerRef.current.src = video.src;
            playerRef.current.load();
            playerRef.current.pause();
            playerRef.current.playbackRate = playbackRate;
            playerRef.current.currentTime = 0;
          }
        }

        playerRef.current?.play();
      },
      pause() {
        playerRef.current?.pause();
      },
      toggle(video) {
        this.isPlaying(video) ? actions.pause() : actions.play(video);
      },
      seekBy(amount) {
        if (playerRef.current) {
          playerRef.current.currentTime += amount;
        }
      },
      seek(time) {
        if (playerRef.current) {
          playerRef.current.currentTime = time;
        }
      },
      playbackRate(rate) {
        if (playerRef.current) {
          playerRef.current.playbackRate = rate;
        }
      },
      toggleMute() {
        dispatch({ type: ActionKind.TOGGLE_MUTE });
      },
      toggleFullscreen() {
        if (playerRef.current) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
            dispatch({ type: ActionKind.TOGGLE_FULLSCREEN });
          } else {
            playerRef.current.requestFullscreen();
            dispatch({ type: ActionKind.TOGGLE_FULLSCREEN });
          }
        }
      },
      setVolume(volume) {
        if (playerRef.current) {
          playerRef.current.volume = volume;
          dispatch({ type: ActionKind.SET_VOLUME, payload: volume });
        }
      },
      isPlaying(video) {
        return video
          ? state.playing && playerRef.current?.currentSrc === video.src
          : state.playing;
      },
    };
  }, [state.playing]);

  const api = useMemo<PlayerAPI>(
    () => ({ ...state, ...actions, playerRef, dispatch }),
    [state, actions, playerRef, dispatch],
  );

  return (
    <>
      <VideoPlayerContext.Provider value={api}>
        {children}
      </VideoPlayerContext.Provider>
      <video
        ref={playerRef}
        onPlay={() => dispatch({ type: ActionKind.PLAY })}
        onPause={() => dispatch({ type: ActionKind.PAUSE })}
        onTimeUpdate={event => {
          dispatch({
            type: ActionKind.SET_CURRENT_TIME,
            payload: Math.floor(event.currentTarget.currentTime),
          });
        }}
        onDurationChange={event => {
          dispatch({
            type: ActionKind.SET_DURATION,
            payload: Math.floor(event.currentTarget.duration),
          });
        }}
        onVolumeChange={event => {
          dispatch({
            type: ActionKind.SET_VOLUME,
            payload: event.currentTarget.volume,
          });
        }}
        muted={state.muted}
        src={src}
        autoPlay
        playsInline
        loop
        className="w-full rounded-t-xl md:rounded-b-xl z-10"
      />
    </>
  );
}

export function useVideoPlayer(video?: Video) {
  const player = useContext(VideoPlayerContext);

  return useMemo<PlayerAPI>(
    () => ({
      ...player!,
      play() {
        player!.play(video);
      },
      toggle() {
        player!.toggle(video);
      },
      get playing() {
        return player!.isPlaying(video);
      },
    }),
    [player, video],
  );
}
