import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export type MultiplayerPrompt = {
  id: string;
  content: string;
  created_at: string;
};

export function usePromptsApi() {
  const [prompts, setPrompts] = useState<MultiplayerPrompt[]>([]);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);

  const submitPrompt = useCallback(async (content: string) => {
    const newPrompt: MultiplayerPrompt = {
      id: uuidv4(),
      content,
      created_at: Date.now().toString(),
    };

    // Optimistically append to UI
    setPrompts(prev => [...prev, newPrompt]);

    const res = await fetch("/api/prompts", {
      method: "POST",
      body: JSON.stringify(newPrompt),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    return data;
  }, []);

  const pollPrompts = useCallback(async () => {
    const res = await fetch("/api/prompts/poll");
    const data = await res.json();

    const serverPrompts: MultiplayerPrompt[] = data.prompts;
    const serverActiveIndex: string = data.activeIndex;

    setPrompts(serverPrompts.reverse());
    setActiveIndex(serverActiveIndex);
  }, []);

  useEffect(() => {
    pollPrompts(); // initial
    const interval = setInterval(pollPrompts, 1000);
    return () => clearInterval(interval);
  }, [pollPrompts]);

  return {
    prompts,
    activeIndex,
    submitPrompt,
  };
}
