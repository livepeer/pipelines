import Daydream from "@/components/daydream";
import track from "@/lib/track";
import { identifyTikTokInAppBrowser } from "@/lib/userAgentIdentify";
import { headers } from "next/headers";
import { cache } from "react";
import { getSharedParams } from "../api/streams/share-params";
import TikTokFallback from "./TikTokFallback";

const getCachedSharedParams = cache(async (shareParamsId: string) => {
  const { data: sharedParams } = await getSharedParams(shareParamsId);
  return sharedParams;
});

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: { shared: string };
}) => {
  const { shared } = searchParams;
  const metaData = {
    title: "Daydream",
    description: "Transform your video in real-time with AI",
  };

  if (!shared) {
    return metaData;
  }

  // Update the description with the shared prompt
  const sharedParams = await getCachedSharedParams(shared);
  const sharedPrompt =
    sharedParams?.params?.prompt?.["5"]?.inputs?.text || metaData.description;
  metaData.description = sharedPrompt;
  return { ...metaData, openGraph: metaData };
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: {
    shared: string;
    privy_oauth_code: string;
    inputPrompt: string;
    sourceClipId: string;
  };
}) {
  const requestHeaders = headers();
  const userAgent = requestHeaders.get("user-agent")?.toLowerCase();

  const { shared, privy_oauth_code, inputPrompt } = searchParams;
  const isGuestAccess = !!inputPrompt; // If there's an inputPrompt, the user is coming from "Try this prompt"

  if (userAgent && identifyTikTokInAppBrowser(userAgent)) {
    track("tiktok_browser_fallback_shown");
    return <TikTokFallback />;
  }

  return (
    <Daydream
      hasSharedPrompt={!!shared || !!inputPrompt}
      isOAuthSuccessRedirect={
        privy_oauth_code?.length > 0 && privy_oauth_code !== "error"
      }
      allowGuestAccess={isGuestAccess}
    />
  );
}
