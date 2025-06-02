"use client";

import { useEffect, useRef, useState } from "react";

import { useVideoPlayer } from "./VideoProvider";
import { Slider } from "./Slider";
import { PlayButton } from "./PlayButton";
import { MuteButton } from "./MuteButton";
function parseTime(seconds: number) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds - hours * 3600) / 60);
  seconds = seconds - hours * 3600 - minutes * 60;
  return [hours, minutes, seconds];
}

function formatHumanTime(seconds: number) {
  let [h, m, s] = parseTime(seconds);
  return `${h} hour${h === 1 ? "" : "s"}, ${m} minute${
    m === 1 ? "" : "s"
  }, ${s} second${s === 1 ? "" : "s"}`;
}

export function VideoPlayer() {
  let player = useVideoPlayer();
  let wasPlayingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(player.currentTime ?? 0);
  const justFinishedDragging = useRef(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastPlayerTimeRef = useRef<number>(0);
  const lastPlayerTimeUpdateRef = useRef<number>(0);

  const animateSlider = () => {
    const now = performance.now();
    const elapsed = (now - (lastPlayerTimeUpdateRef.current ?? now)) / 1000;
    let interpolatedTime = (lastPlayerTimeRef.current ?? 0) + elapsed;

    interpolatedTime = Math.max(
      0,
      Math.min(interpolatedTime, player.duration ?? Infinity),
    );

    if (Math.abs(sliderValue - interpolatedTime) > 0.01) {
      setSliderValue(interpolatedTime);
    }

    animationFrameRef.current = requestAnimationFrame(animateSlider);
  };

  useEffect(() => {
    const playerTime = player.currentTime ?? 0;

    const cleanupAnimation = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    lastPlayerTimeRef.current = playerTime;
    lastPlayerTimeUpdateRef.current = performance.now();

    if (isDragging) {
      cleanupAnimation();
    } else if (justFinishedDragging.current) {
      if (Math.abs(playerTime - sliderValue) < 0.1) {
        justFinishedDragging.current = false;
        if (player.playing) {
          if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(animateSlider);
          }
        } else {
          setSliderValue(playerTime);
        }
      } else {
        cleanupAnimation();
      }
    } else if (player.playing) {
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateSlider);
      }
    } else {
      cleanupAnimation();
      setSliderValue(playerTime);
    }

    return cleanupAnimation;
  }, [player.currentTime, player.playing, isDragging, sliderValue]);

  return (
    <div className="absolute left-0 right-0 bottom-0 translate-y-1/2 z-40">
      <div className="mb-[env(safe-area-inset-bottom)] flex flex-1 flex-col gap-3 overflow-hidden p-1">
        <div className="flex justify-between gap-6 rounded-lg bg-white px-2 py-2 shadow-sm ring-1 shadow-slate-200/80 ring-slate-900/5 backdrop-blur-xs md:px-4">
          <div className="flex flex-none items-center gap-4">
            <PlayButton player={player} />
          </div>
          <Slider
            label="Current time"
            maxValue={player.duration}
            step={0.001}
            value={sliderValue}
            onChange={setSliderValue}
            onChangeEnd={value => {
              player.seek(value);
              setSliderValue(value);
              setIsDragging(false);
              justFinishedDragging.current = true;
              if (wasPlayingRef.current) {
                player.play();
              }
            }}
            onChangeStart={() => {
              setIsDragging(true);
              wasPlayingRef.current = player.playing;
              player.pause();
            }}
            numberFormatter={{ format: formatHumanTime } as Intl.NumberFormat}
          />
          <div className="flex flex-none items-center gap-4">
            <MuteButton player={player} />
          </div>
        </div>
      </div>
    </div>
  );
}
