import track from "@/lib/track";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef, useState, useCallback } from "react";

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

// Global cache for shared state and WebSocket connections
interface CacheEntry {
  currentPrompt: CurrentPrompt | null;
  recentPrompts: RecentPromptItem[];
  isSubmitting: boolean;
  ws: WebSocket | null;
  subscribers: Set<() => void>;
  reconnectTimer: NodeJS.Timeout | null;
}

const promptQueueCache: Map<string, CacheEntry> = new Map();

function getCacheEntry(streamKey: string): CacheEntry {
  if (!promptQueueCache.has(streamKey)) {
    promptQueueCache.set(streamKey, {
      currentPrompt: null,
      recentPrompts: [],
      isSubmitting: false,
      ws: null,
      subscribers: new Set(),
      reconnectTimer: null,
    });
  }
  return promptQueueCache.get(streamKey)!;
}

function notifySubscribers(streamKey: string) {
  const entry = promptQueueCache.get(streamKey);
  if (entry) {
    entry.subscribers.forEach(callback => callback());
  }
}

function connectWebSocket(streamKey: string) {
  const entry = getCacheEntry(streamKey);

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
    `${wsUrl}/ws?streamKey=${encodeURIComponent(streamKey)}`,
  );

  ws.onopen = () => {
    const currentEntry = promptQueueCache.get(streamKey);
    if (currentEntry && currentEntry.subscribers.size > 0) {
      currentEntry.ws = ws;
    } else {
      ws.close();
    }
  };

  ws.onmessage = event => {
    const currentEntry = promptQueueCache.get(streamKey);
    if (!currentEntry || currentEntry.ws !== ws) {
      return;
    }

    try {
      const message = JSON.parse(event.data);
      console.log("onmessage", message.type);

      switch (message.type) {
        case "initial":
          currentEntry.currentPrompt = message.payload.currentPrompt;
          currentEntry.recentPrompts = message.payload.recentPrompts || [];
          notifySubscribers(streamKey);
          break;

        case "CurrentPrompt":
          currentEntry.currentPrompt = message.payload.prompt;
          notifySubscribers(streamKey);
          break;

        case "RecentPromptsUpdate":
          currentEntry.recentPrompts = message.payload.recent_prompts || [];
          notifySubscribers(streamKey);
          break;

        default:
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.onclose = event => {
    const currentEntry = promptQueueCache.get(streamKey);
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
        const stillCurrentEntry = promptQueueCache.get(streamKey);
        if (stillCurrentEntry && stillCurrentEntry.subscribers.size > 0) {
          connectWebSocket(streamKey);
        }
      }, 3000);
    }
  };

  ws.onerror = error => {
    console.error("WebSocket error for streamKey:", streamKey, error);
  };
}

function cleanupCacheEntry(streamKey: string) {
  const entry = promptQueueCache.get(streamKey);
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
    promptQueueCache.delete(streamKey);
  }
}

export function usePromptQueue(streamKey: string | undefined) {
  const [, forceUpdate] = useState({});
  const currentStreamKeyRef = useRef<string | undefined>(streamKey);
  const { authenticated } = usePrivy();

  const rerender = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    // Clean up previous subscription if streamKey changed
    if (
      currentStreamKeyRef.current &&
      currentStreamKeyRef.current !== streamKey
    ) {
      const prevEntry = promptQueueCache.get(currentStreamKeyRef.current);
      if (prevEntry) {
        prevEntry.subscribers.delete(rerender);
        cleanupCacheEntry(currentStreamKeyRef.current);
      }
    }

    currentStreamKeyRef.current = streamKey;

    if (!streamKey) {
      return;
    }

    const entry = getCacheEntry(streamKey);
    entry.subscribers.add(rerender);

    // Connect WebSocket if not already connected
    if (!entry.ws && entry.subscribers.size === 1) {
      connectWebSocket(streamKey);
    }

    return () => {
      if (streamKey) {
        const currentEntry = promptQueueCache.get(streamKey);
        if (currentEntry) {
          currentEntry.subscribers.delete(rerender);
          cleanupCacheEntry(streamKey);
        }
      }
    };
  }, [streamKey, rerender]);

  // Get current state from cache
  const entry = streamKey ? promptQueueCache.get(streamKey) : null;
  const currentPrompt = entry?.currentPrompt || null;
  const recentPrompts = entry?.recentPrompts || [];
  const isSubmitting = entry?.isSubmitting || false;

  const getHighlightedIndex = useCallback(() => {
    if (!currentPrompt?.prompt?.id) return -1;
    return recentPrompts.findIndex(item => item.id === currentPrompt.prompt.id);
  }, [currentPrompt, recentPrompts]);

  const submitPrompt = useCallback(
    async (text: string) => {
      if (!text.trim() || !streamKey || isSubmitting) return false;

      const entry = getCacheEntry(streamKey);
      entry.isSubmitting = true;
      notifySubscribers(streamKey);

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
        const currentEntry = promptQueueCache.get(streamKey);
        if (currentEntry) {
          currentEntry.isSubmitting = false;
          notifySubscribers(streamKey);
        }
      }
    },
    [streamKey, isSubmitting, authenticated],
  );

  const addRandomPrompt = useCallback(async () => {
    if (!streamKey || isSubmitting) return false;

    const entry = getCacheEntry(streamKey);
    entry.isSubmitting = true;
    notifySubscribers(streamKey);

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
      const currentEntry = promptQueueCache.get(streamKey);
      if (currentEntry) {
        currentEntry.isSubmitting = false;
        notifySubscribers(streamKey);
      }
    }
  }, [streamKey, isSubmitting]);

  return {
    currentPrompt,
    recentPrompts,
    isSubmitting,
    wsRef: { current: entry?.ws || null },
    getHighlightedIndex,
    submitPrompt,
    addRandomPrompt,
  };
}
