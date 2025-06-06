import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef, useState, useCallback } from "react";

export interface CurrentPrompt {
  prompt: {
    id: string;
    content: string;
    submitted_at: string;
  };
  started_at: string;
}

export interface RecentPromptItem {
  id: string;
  text: string;
  timestamp: number;
}

// Global cache for shared state and WebSocket connections
interface CacheEntry {
  currentPrompt: CurrentPrompt | null;
  recentPrompts: RecentPromptItem[];
  isSubmitting: boolean;
  ws: WebSocket | null;
  subscribers: Set<() => void>;
  reconnectTimer: NodeJS.Timeout | null;
  queuePositions: Map<string, number>; // Map of promptId -> position
}

const promptQueueCache: Map<string, CacheEntry> = new Map();

function getCacheEntry(streamId: string): CacheEntry {
  if (!promptQueueCache.has(streamId)) {
    promptQueueCache.set(streamId, {
      currentPrompt: null,
      recentPrompts: [],
      isSubmitting: false,
      ws: null,
      subscribers: new Set(),
      reconnectTimer: null,
      queuePositions: new Map(),
    });
  }
  return promptQueueCache.get(streamId)!;
}

function notifySubscribers(streamId: string) {
  const entry = promptQueueCache.get(streamId);
  if (entry) {
    entry.subscribers.forEach(callback => callback());
  }
}

function connectWebSocket(streamId: string) {
  const entry = getCacheEntry(streamId);

  if (entry.ws) {
    entry.ws.close();
    entry.ws = null;
  }

  if (entry.reconnectTimer) {
    clearTimeout(entry.reconnectTimer);
    entry.reconnectTimer = null;
  }

  const wsUrl = process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8080";
  const ws = new WebSocket(
    `${wsUrl}/ws?streamId=${encodeURIComponent(streamId)}`,
  );

  ws.onopen = () => {
    const currentEntry = promptQueueCache.get(streamId);
    if (currentEntry && currentEntry.subscribers.size > 0) {
      currentEntry.ws = ws;
    } else {
      ws.close();
    }
  };

  ws.onmessage = event => {
    const currentEntry = promptQueueCache.get(streamId);
    if (!currentEntry || currentEntry.ws !== ws) {
      return;
    }

    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "initial":
          currentEntry.currentPrompt = message.payload.currentPrompt;
          currentEntry.recentPrompts = message.payload.recentPrompts || [];
          notifySubscribers(streamId);
          break;

        case "CurrentPrompt":
          if (
            currentEntry.currentPrompt?.prompt?.id !==
            message.payload.prompt?.prompt?.id
          ) {
            const updatedPositions = new Map<string, number>();
            currentEntry.queuePositions.forEach((position, promptId) => {
              if (position > 1) {
                updatedPositions.set(promptId, position - 1);
              }
            });
            currentEntry.queuePositions = updatedPositions;
          }

          currentEntry.currentPrompt = message.payload.prompt;
          notifySubscribers(streamId);
          break;

        case "RecentPromptsUpdate":
          currentEntry.recentPrompts = message.payload.recent_prompts || [];
          notifySubscribers(streamId);
          break;

        default:
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.onclose = event => {
    const currentEntry = promptQueueCache.get(streamId);
    if (!currentEntry || currentEntry.ws !== ws) {
      return;
    }

    currentEntry.ws = null;

    if (
      event.code !== 1000 &&
      event.code !== 1001 &&
      currentEntry.subscribers.size > 0
    ) {
      console.log("Attempting to reconnect in 3 seconds...");
      currentEntry.reconnectTimer = setTimeout(() => {
        const stillCurrentEntry = promptQueueCache.get(streamId);
        if (stillCurrentEntry && stillCurrentEntry.subscribers.size > 0) {
          connectWebSocket(streamId);
        }
      }, 3000);
    }
  };

  ws.onerror = error => {
    console.error("WebSocket error for streamId:", streamId, error);
  };
}

function cleanupCacheEntry(streamId: string) {
  const entry = promptQueueCache.get(streamId);
  if (!entry) return;

  if (entry.subscribers.size === 0) {
    if (entry.ws) {
      entry.ws.close();
      entry.ws = null;
    }
    if (entry.reconnectTimer) {
      clearTimeout(entry.reconnectTimer);
      entry.reconnectTimer = null;
    }
    promptQueueCache.delete(streamId);
  }
}

export function usePromptQueue(streamId: string | undefined) {
  const [, forceUpdate] = useState({});
  const currentStreamIdRef = useRef<string | undefined>(streamId);
  const { authenticated } = usePrivy();

  const rerender = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    // Clean up previous subscription if streamKey changed
    if (currentStreamIdRef.current && currentStreamIdRef.current !== streamId) {
      const prevEntry = promptQueueCache.get(currentStreamIdRef.current);
      if (prevEntry) {
        prevEntry.subscribers.delete(rerender);
        cleanupCacheEntry(currentStreamIdRef.current);
      }
    }

    currentStreamIdRef.current = streamId;

    if (!streamId) {
      return;
    }

    const entry = getCacheEntry(streamId);
    entry.subscribers.add(rerender);

    // Connect WebSocket if not already connected
    if (!entry.ws && entry.subscribers.size === 1) {
      connectWebSocket(streamId);
    }

    return () => {
      if (streamId) {
        const currentEntry = promptQueueCache.get(streamId);
        if (currentEntry) {
          currentEntry.subscribers.delete(rerender);
          cleanupCacheEntry(streamId);
        }
      }
    };
  }, [streamId, rerender]);

  const entry = streamId ? promptQueueCache.get(streamId) : null;
  const currentPrompt = entry?.currentPrompt || null;
  const recentPrompts = entry?.recentPrompts || [];
  const isSubmitting = entry?.isSubmitting || false;
  const queuePositions = entry?.queuePositions || new Map();

  // Clear queue position when prompt becomes active or is removed
  useEffect(() => {
    if (entry && currentPrompt?.prompt?.id) {
      entry.queuePositions.delete(currentPrompt.prompt.id);
      notifySubscribers(streamId!);
    }
  }, [entry, currentPrompt?.prompt?.id, streamId]);

  const getHighlightedIndex = useCallback(() => {
    if (!currentPrompt?.prompt?.id) return -1;
    return recentPrompts.findIndex(item => item.id === currentPrompt.prompt.id);
  }, [currentPrompt, recentPrompts]);

  const submitPrompt = useCallback(
    async (text: string) => {
      if (!text.trim() || !streamId || isSubmitting)
        return { success: false, promptId: null };

      const entry = getCacheEntry(streamId);
      entry.isSubmitting = true;
      notifySubscribers(streamId);

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await fetch(
          `${apiUrl}/streams/${streamId}/prompts/queue`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text.trim(),
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Store the queue position
        if (result.id && typeof result.queue_position === "number") {
          entry.queuePositions.set(result.id, result.queue_position);
        }

        track("daydream_landing_page_prompt_submitted", {
          is_authenticated: authenticated,
          prompt: text,
          nsfw: result?.wasCensored || false,
          stream_id: streamId,
        });

        return { success: true, promptId: result.id };
      } catch (error) {
        return { success: false, promptId: null };
      } finally {
        const currentEntry = promptQueueCache.get(streamId);
        if (currentEntry) {
          currentEntry.isSubmitting = false;
          notifySubscribers(streamId);
        }
      }
    },
    [streamId, isSubmitting, authenticated],
  );

  const addRandomPrompt = useCallback(async () => {
    if (!streamId || isSubmitting) return false;

    const entry = getCacheEntry(streamId);
    entry.isSubmitting = true;
    notifySubscribers(streamId);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(
        `${apiUrl}/streams/${streamId}/prompts/queue`,
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
      const currentEntry = promptQueueCache.get(streamId);
      if (currentEntry) {
        currentEntry.isSubmitting = false;
        notifySubscribers(streamId);
      }
    }
  }, [streamId, isSubmitting]);

  return {
    currentPrompt,
    recentPrompts,
    isSubmitting,
    wsRef: { current: entry?.ws || null },
    getHighlightedIndex,
    submitPrompt,
    addRandomPrompt,
    getQueuePosition: useCallback(
      (promptId: string) => queuePositions.get(promptId),
      [queuePositions],
    ),
  };
}
