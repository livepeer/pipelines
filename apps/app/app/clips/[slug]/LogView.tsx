import { handleSessionId } from "@/lib/analytics/mixpanel";
import { getAccessToken } from "@privy-io/react-auth";
import { useEffect } from "react";

export const LogView = ({ clipId }: { clipId: string }) => {
  useEffect(() => {
    const log = async () => {
      const accessToken = await getAccessToken();
      await fetch(`/api/clips/${clipId}/views`, {
        method: "POST",
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: handleSessionId() }),
      });
    };

    log();
  }, []);

  return <></>;
};
