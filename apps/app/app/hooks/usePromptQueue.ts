import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";

export interface CurrentPrompt {
  prompt: {
    id: string;
    content: string;
    submitted_at: string;
    stream_key: string;
  };
  started_at: string;
}

export interface RecentPromptItem {
  id: string;
  text: string;
  timestamp: number;
}

export function usePromptQueue(streamKey: string | undefined) {
  const [currentPrompt, setCurrentPrompt] = useState<CurrentPrompt | null>(
    null,
  );
  const [recentPrompts, setRecentPrompts] = useState<RecentPromptItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const currentStreamKeyRef = useRef<string | undefined>(streamKey);
  const { authenticated } = usePrivy();

  useEffect(() => {
    if (currentStreamKeyRef.current !== streamKey) {
      setCurrentPrompt(null);
      setRecentPrompts([]);
      setIsSubmitting(false);
      currentStreamKeyRef.current = streamKey;
    }

    if (!streamKey) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    if (wsRef.current) {
      console.log("Closing previous WebSocket connection");
      wsRef.current.close();
      wsRef.current = null;
    }

    const connectWebsocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8080";
      const ws = new WebSocket(
        `${wsUrl}/ws?streamKey=${encodeURIComponent(streamKey)}`,
      );

      ws.onopen = () => {
        if (currentStreamKeyRef.current === streamKey) {
          wsRef.current = ws;
        } else {
          ws.close();
        }
      };

      ws.onmessage = event => {
        if (wsRef.current !== ws || currentStreamKeyRef.current !== streamKey) {
          return;
        }

        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case "initial":
              setCurrentPrompt(message.payload.currentPrompt);
              setRecentPrompts(message.payload.recentPrompts || []);
              break;

            case "CurrentPrompt":
              setCurrentPrompt(message.payload.prompt);
              break;

            case "RecentPromptsUpdate":
              setRecentPrompts(message.payload.recent_prompts || []);
              break;

            default:
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = event => {
        if (wsRef.current !== ws || currentStreamKeyRef.current !== streamKey) {
          return;
        }

        if (
          event.code !== 1000 &&
          event.code !== 1001 &&
          currentStreamKeyRef.current === streamKey
        ) {
          console.log("Attempting to reconnect in 3 seconds...");
          setTimeout(() => {
            if (currentStreamKeyRef.current === streamKey) {
              connectWebsocket();
            }
          }, 3000);
        }
      };

      ws.onerror = error => {
        console.error("WebSocket error for streamKey:", streamKey, error);
      };
    };

    connectWebsocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [streamKey]);

  const getHighlightedIndex = () => {
    if (!currentPrompt?.prompt?.id) return -1;
    return recentPrompts.findIndex(item => item.id === currentPrompt.prompt.id);
  };

  const submitPrompt = async (text: string) => {
    if (!text.trim() || !streamKey || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          streamKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      track("daydream_landing_page_prompt_submitted", {
        is_authenticated: authenticated,
        prompt: text,
        nsfw: result?.wasCensored || false,
        stream_key: streamKey,
      });

      return true;
    } catch (error) {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRandomPrompt = async () => {
    if (!streamKey || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${apiUrl}/prompts?streamKey=${encodeURIComponent(streamKey)}`,
        {
          method: "PUT",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentPrompt,
    recentPrompts,
    isSubmitting,
    wsRef,
    getHighlightedIndex,
    submitPrompt,
    addRandomPrompt,
  };
}
