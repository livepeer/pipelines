import { useEffect } from "react";

interface RandomPromptTimerOptions {
  authenticated: boolean;
  ready: boolean;
  showContent: boolean;
  addRandomPrompt: () => void;
}

export function useRandomPromptTimer({
  authenticated,
  ready,
  showContent,
  addRandomPrompt,
}: RandomPromptTimerOptions) {
  useEffect(() => {
    if (!authenticated && ready && showContent) {
      const getRandomInterval = () => Math.floor(Math.random() * 7500) + 1500;

      let timerId: NodeJS.Timeout;

      timerId = setTimeout(function addPrompt() {
        addRandomPrompt();
        timerId = setTimeout(addPrompt, getRandomInterval());
      }, getRandomInterval());

      return () => clearTimeout(timerId);
    }
  }, [authenticated, ready, showContent, addRandomPrompt]);
}
