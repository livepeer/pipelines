import Daydream from "@/components/daydream";
import { getSharedParams } from "../api/streams/share-params";
import { cache } from "react";
import { headers } from "next/headers";
import Link from "next/link";

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

  const isTikTokUserAgent =
    userAgent?.includes("tiktok") ||
    userAgent?.includes("musical_ly") ||
    userAgent?.includes("bytedance");

  const { shared, privy_oauth_code, inputPrompt } = searchParams;
  const isGuestAccess = !!inputPrompt; // If there's an inputPrompt, the user is coming from "Try this prompt"

  if (isTikTokUserAgent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Streaming is limited in the TikTok browser.
        </h1>
        <p className="mb-6">
          For the best experience, please use Safari or Chrome browser.
        </p>
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
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
