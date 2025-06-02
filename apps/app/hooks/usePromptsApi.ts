import { useCallback, useEffect, useState, useRef } from "react";
import { PromptState, AddPromptRequest } from "@/app/api/prompts/types";
import { toast } from "sonner";

const SESSION_ID_KEY = "prompt_session_id";
const RECONNECT_DELAY = 3000;

export function usePromptsApi(streamKey?: string) {
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

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

  const connectWebSocket = useCallback(() => {
    if (
      !streamKey ||
      wsRef.current?.readyState === WebSocket.OPEN ||
      isConnectingRef.current
    ) {
      return;
    }

    isConnectingRef.current = true;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8080";
      const ws = new WebSocket(
        `${wsUrl}/ws?streamKey=${encodeURIComponent(streamKey)}`,
      );

      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        setError(null);
        setLoading(false);
        isConnectingRef.current = false;
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);

          if (data.type === "initial") {
            console.log("Initial data payload:", data.payload);
            const payload = data.payload;
            if (payload.promptState) {
              const userPromptIndices =
                payload.promptState.userPromptIndices.map(
                  (isUser: boolean, index: number) => {
                    return (
                      isUser &&
                      payload.promptState.promptSessionIds &&
                      payload.promptState.promptSessionIds[index] === sessionId
                    );
                  },
                );

              setPromptState({
                ...payload.promptState,
                userPromptIndices,
              });
            }
          }

          // Handle prompt updates
          else if (data.type === "CurrentPrompt") {
            console.log("CurrentPrompt update:", data.payload);
            const { prompt, stream_key } = data.payload;
            if (stream_key === streamKey) {
              if (prompt) {
                setPromptState(prevState => ({
                  ...(prevState || {
                    promptQueue: [],
                    displayedPrompts: [],
                    promptAvatarSeeds: [],
                    userPromptIndices: [],
                    promptSessionIds: [],
                    highlightedSince: 0,
                    streamKey: streamKey,
                  }),
                  displayedPrompts: [prompt.prompt.content],
                  promptAvatarSeeds: [prompt.prompt.avatar_seed],
                  userPromptIndices: [
                    prompt.prompt.submitted_by === "user" &&
                      prompt.prompt.session_id === sessionId,
                  ],
                  promptSessionIds: [prompt.prompt.session_id],
                  highlightedSince: new Date(prompt.started_at).getTime(),
                }));
              }
            }
          } else if (data.type === "StateUpdate") {
            console.log("StateUpdate received:", data.payload);
            const { promptState, stream_key } = data.payload;
            if (stream_key === streamKey && promptState) {
              const userPromptIndices = promptState.userPromptIndices.map(
                (isUser: boolean, index: number) => {
                  return (
                    isUser &&
                    promptState.promptSessionIds &&
                    promptState.promptSessionIds[index] === sessionId
                  );
                },
              );

              setPromptState({
                ...promptState,
                userPromptIndices,
              });
            }
          } else if (data.type === "Error") {
            console.error("WebSocket error:", data.payload.message);
            setError(data.payload.message);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onerror = err => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection error");
        setConnected(false);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        wsRef.current = null;
        isConnectingRef.current = false;

        if (isMountedRef.current) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connectWebSocket();
          }, RECONNECT_DELAY);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
      setError("Failed to connect to server");
      setLoading(false);
      isConnectingRef.current = false;
    }
  }, [streamKey, sessionId]);

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
          sessionId,
          streamKey,
        };

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await fetch(`${apiUrl}/prompts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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

        return data;
      } catch (err) {
        console.error("Failed to add prompt:", err);
        setError("Failed to add prompt");
        return { wasCensored: false };
      }
    },
    [sessionId, streamKey],
  );

  const addRandomPrompt = useCallback(async () => {
    if (!streamKey) {
      console.error("No stream key provided");
      return false;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${apiUrl}/prompts?streamKey=${encodeURIComponent(streamKey)}`,
        {
          method: "PUT",
        },
      );

      if (!response.ok) {
        throw new Error(`Error adding random prompt: ${response.statusText}`);
      }

      return true;
    } catch (err) {
      console.error("Failed to add random prompt:", err);
      setError("Failed to add random prompt");
      return false;
    }
  }, [streamKey]);

  useEffect(() => {
    isMountedRef.current = true;

    if (streamKey) {
      connectWebSocket();
    }

    return () => {
      isMountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [streamKey, connectWebSocket]);

  return {
    promptState,
    loading,
    error,
    connected,
    userAvatarSeed,
    addToPromptQueue,
    addRandomPrompt,
  };
}
