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

  useEffect(() => {
    const playerTime = player.currentTime ?? 0;

    if (justFinishedDragging.current) {
      if (Math.abs(playerTime - sliderValue) < 0.1) {
        justFinishedDragging.current = false;
      }
    } else if (!isDragging) {
      if (Math.abs(sliderValue - playerTime) > 0.1) {
        setSliderValue(playerTime);
      }
    }
  }, [player.currentTime, isDragging, sliderValue]);

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
