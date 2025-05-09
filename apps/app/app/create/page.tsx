import Daydream from "@/components/daydream";
import { getSharedParams } from "../api/streams/share-params";
import { cache } from "react";

const getCachedSharedParams = cache(async (shareParamsId: string) => {
  const { data: sharedParams } = await getSharedParams(shareParamsId);
  return sharedParams;
});

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<{ shared: string }>;
}) => {
  const { shared } = await searchParams;
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
  searchParams: Promise<{
    shared: string;
    privy_oauth_code: string;
    inputPrompt: string;
    sourceClipId: string;
  }>;
}) {
  const { shared, privy_oauth_code, inputPrompt } = await searchParams;
  const isGuestAccess = !!inputPrompt; // If there's an inputPrompt, the user is coming from "Try this prompt"

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
