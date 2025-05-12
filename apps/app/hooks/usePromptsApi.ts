import { useCallback, useEffect, useState } from "react";
import { PromptState, AddPromptRequest } from "@/app/api/prompts/types";

const POLLING_INTERVAL = 3000; // Poll every second

export function usePromptsApi() {
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userAvatarSeed] = useState(
    `user-${Math.random().toString(36).substring(2, 10)}`,
  );

  const fetchPromptState = useCallback(async () => {
    try {
      const response = await fetch("/api/prompts");
      if (!response.ok) {
        throw new Error(`Error fetching prompts: ${response.statusText}`);
      }
      const data = await response.json();
      setPromptState(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch prompt state:", err);
      setError("Failed to fetch prompt state");
    } finally {
      setLoading(false);
    }
  }, []);

  const addToPromptQueue = useCallback(
    async (promptText: string, seed: string, isUser: boolean) => {
      try {
        const payload: AddPromptRequest = {
          text: promptText,
          seed,
          isUser,
        };

        const response = await fetch("/api/prompts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error adding prompt: ${response.statusText}`);
        }

        await fetchPromptState();
        return true;
      } catch (err) {
        console.error("Failed to add prompt:", err);
        setError("Failed to add prompt");
        return false;
      }
    },
    [fetchPromptState],
  );

  const addRandomPrompt = useCallback(async () => {
    try {
      const response = await fetch("/api/prompts", {
        method: "PATCH",
      });

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
  }, [fetchPromptState]);

  useEffect(() => {
    fetchPromptState();

    const intervalId = setInterval(() => {
      fetchPromptState();
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchPromptState]);

  return {
    promptState,
    loading,
    error,
    userAvatarSeed,
    addToPromptQueue,
    addRandomPrompt,
  };
}
