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

  return (
    <div className="flex items-center gap-6 bg-white px-2 py-2 shadow-sm ring-1 shadow-slate-200/80 ring-slate-900/5 backdrop-blur-xs md:px-4 rounded-b-xl md:rounded-t-xl">
      <div className="mb-[env(safe-area-inset-bottom)] flex flex-1 flex-col gap-3 overflow-hidden p-1">
        <div className="flex justify-between gap-6 rounded-xl">
          <div className="flex flex-none items-center gap-4">
            <PlayButton player={player} />
          </div>
          <Slider
            label="Current time"
            maxValue={player.duration}
            step={0.001}
            value={[player.currentTime ?? 0]}
            onChangeEnd={([value]) => {
              player.seek(value);
              if (wasPlayingRef.current) {
                player.play();
              }
            }}
            numberFormatter={{ format: formatHumanTime } as Intl.NumberFormat}
            onChangeStart={() => {
              wasPlayingRef.current = player.playing;
              player.pause();
            }}
          />
          <div className="flex flex-none items-center gap-4">
            <MuteButton player={player} />
          </div>
        </div>
      </div>
    </div>
  );
}
