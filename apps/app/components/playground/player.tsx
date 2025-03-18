import { useAppConfig } from "@/hooks/useAppConfig";
import { isProduction } from "@/lib/env";
import { useSearchParams } from "next/navigation";

export function LPPLayer({
  output_playback_id,
  isMobile,
  stream_key,
}: {
  output_playback_id: string;
  isMobile?: boolean;
  stream_key: string | null;
}) {
  const appConfig = useAppConfig();
  // default to direct playback but allow us to disable this and go back to studio playback with an env variable or queryparam
  let playerUrl = `${appConfig.whipUrl}${appConfig?.whipUrl?.endsWith("/") ? "" : "/"}${stream_key}-out`;
  const searchParams = useSearchParams();
  if (
    (searchParams.get("directPlayback") !== "true" &&
      process.env.NEXT_PUBLIC_LIVEPEER_DIRECT_PLAYBACK === "false") ||
    searchParams.get("directPlayback") === "false"
  ) {
    playerUrl = `https://${isProduction() ? "lvpr.tv" : "monster.lvpr.tv"}/?v=${output_playback_id}&lowLatency=force&backoffMax=1000&ingestPlayback=true`;
  }
  return (
    <div className={isMobile ? "w-full h-full" : "aspect-video"}>
      <iframe
        src={playerUrl}
        className="w-full h-full"
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
}
