import { PlayerAPI } from "./VideoProvider";

function PlayIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" {...props}>
      <path d="M33.75 16.701C34.75 17.2783 34.75 18.7217 33.75 19.299L11.25 32.2894C10.25 32.8668 9 32.1451 9 30.9904L9 5.00962C9 3.85491 10.25 3.13323 11.25 3.71058L33.75 16.701Z" />
    </svg>
  );
}

function PauseIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" {...props}>
      <path d="M8.5 4C7.67157 4 7 4.67157 7 5.5V30.5C7 31.3284 7.67157 32 8.5 32H11.5C12.3284 32 13 31.3284 13 30.5V5.5C13 4.67157 12.3284 4 11.5 4H8.5ZM24.5 4C23.6716 4 23 4.67157 23 5.5V30.5C23 31.3284 23.6716 32 24.5 32H27.5C28.3284 32 29 31.3284 29 30.5V5.5C29 4.67157 28.3284 4 27.5 4H24.5Z" />
    </svg>
  );
}

export function PlayButton({ player }: { player: PlayerAPI }) {
  let Icon = player.playing ? PauseIcon : PlayIcon;

  return (
    <button
      type="button"
      className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-900 focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:outline-none md:h-14 md:w-14"
      onClick={() => player.toggle()}
      aria-label={player.playing ? "Pause" : "Play"}
    >
      <div className="absolute -inset-3 md:hidden" />
      <Icon className="h-5 w-5 fill-white group-active:fill-white/80 md:h-7 md:w-7" />
    </button>
  );
}
