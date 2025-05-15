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

export const MULTIPLAYER_FALLBACK_STREAMS = [
  {
    streamKey: "stk_1MAZq3UNNMRRWVvA",
    originalPlaybackId: "85c28sa2o8wppm58",
    transformedPlaybackId: "95705ossoplg7uvq",
  },
];
