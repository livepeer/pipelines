import { useCallback, useEffect, useMemo, useState } from "react";
import { PromptState, AddPromptRequest } from "@/app/api/prompts/types";
import { toast } from "sonner";
import { getAccessToken } from "@privy-io/react-auth";

const POLLING_INTERVAL = 3000; // Poll every 3 seconds
const SESSION_ID_KEY = "prompt_session_id";

export function usePromptsApi(streamKey?: string) {
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userAvatarSeed] = useState(
    `user-${Math.random().toString(36).substring(2, 10)}`,
  );
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
      if (existingSessionId) {
        return existingSessionId;
      }
      const newSessionId = `session-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(SESSION_ID_KEY, newSessionId);
      return newSessionId;
    }
    return "";
  });
  const accessToken = useMemo(() => {
    return getAccessToken();
  }, []);

  const fetchPromptState = useCallback(async () => {
    if (!streamKey) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/prompts?streamKey=${encodeURIComponent(streamKey)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Error fetching prompts: ${response.statusText}`);
      }
      const data = await response.json();

      if (data && sessionId) {
        data.userPromptIndices = data.userPromptIndices.map(
          (isUser: boolean, index: number) => {
            return (
              isUser &&
              data.promptSessionIds &&
              data.promptSessionIds[index] === sessionId
            );
          },
        );
      }

      setPromptState(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch prompt state:", err);
      setError("Failed to fetch prompt state");
    } finally {
      setLoading(false);
    }
  }, [sessionId, streamKey]);

  const addToPromptQueue = useCallback(
    async (promptText: string, seed: string, isUser: boolean) => {
      if (!streamKey) {
        console.error("No stream key provided");
        return { wasCensored: false };
      }

      try {
        const payload: AddPromptRequest = {
          text: promptText,
          seed,
          isUser,
          sessionId, // Send the session ID with the prompt
          streamKey,
        };

        const response = await fetch("/api/prompts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error adding prompt: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle censored prompts
        if (data.wasCensored) {
          toast.warning("Your prompt has been censored", {
            description: "We've replaced it with a fun, safe alternative.",
            duration: 5000,
          });
        }

        await fetchPromptState();
        return data;
      } catch (err) {
        console.error("Failed to add prompt:", err);
        setError("Failed to add prompt");
        return { wasCensored: false };
      }
    },
    [fetchPromptState, sessionId, streamKey],
  );

  const addRandomPrompt = useCallback(async () => {
    if (!streamKey) {
      console.error("No stream key provided");
      return false;
    }

    try {
      const response = await fetch(
        `/api/prompts?streamKey=${encodeURIComponent(streamKey)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Error adding random prompt: ${response.statusText}`);
      }

      await fetchPromptState();
      return true;
    } catch (err) {
      console.error("Failed to add random prompt:", err);
      setError("Failed to add random prompt");
      return false;
    }
  }, [fetchPromptState, streamKey]);

  useEffect(() => {
    if (streamKey) {
      fetchPromptState();

      const intervalId = setInterval(() => {
        fetchPromptState();
      }, POLLING_INTERVAL);

      return () => clearInterval(intervalId);
    }
  }, [fetchPromptState, streamKey]);

  return {
    promptState,
    loading,
    error,
    userAvatarSeed,
    addToPromptQueue,
    addRandomPrompt,
  };
}
