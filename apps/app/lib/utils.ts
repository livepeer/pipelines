import { User } from "@/hooks/usePrivy";

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const isLivepeerEmail = (user: User | null | undefined): boolean => {
  if (!user) return false;

  const email =
    user.email?.address || user.google?.email || user.discord?.email;

  if (!email) return false;

  return email.endsWith("@livepeer.org");
};

export const MULTIPLAYER_FALLBACK_STREAMS = process.env
  .NEXT_PUBLIC_MULTIPLAYER_FALLBACK_STREAMS
  ? JSON.parse(process.env.NEXT_PUBLIC_MULTIPLAYER_FALLBACK_STREAMS)
  : [
      {
        streamKey: process.env.NEXT_PUBLIC_MULTIPLAYER_STREAM_KEY ?? "",
        originalPlaybackId: process.env.NEXT_PUBLIC_ORIGINAL_PLAYBACK_ID ?? "",
        transformedPlaybackId:
          process.env.NEXT_PUBLIC_TRANSFORMED_PLAYBACK_ID ?? "",
      },
    ];
