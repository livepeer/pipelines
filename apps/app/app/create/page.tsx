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

export default function HomePage({
  searchParams,
}: {
  searchParams: {
    shared: string;
    privy_oauth_code: string;
    clipDetails: string;
  };
}) {
  const { shared, privy_oauth_code, clipDetails } = searchParams;
  const isGuestAccess = !!clipDetails; // If there's an inputPrompt, the user is coming from "Try this prompt"
  const { inputPrompt, sourceClipId } = JSON.parse(
    clipDetails ? atob(clipDetails) : "{}",
  );
  return (
    <Daydream
      hasSharedPrompt={!!shared || !!inputPrompt}
      isOAuthSuccessRedirect={
        privy_oauth_code?.length > 0 && privy_oauth_code !== "error"
      }
      allowGuestAccess={isGuestAccess}
      sourceClipId={sourceClipId}
      inputPrompt={inputPrompt}
    />
  );
}
