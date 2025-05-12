import { useEffect } from "react";

interface RandomPromptApiTimerOptions {
  authenticated: boolean;
  ready: boolean;
  showContent: boolean;
  addRandomPrompt: () => Promise<boolean>;
}

export function useRandomPromptApiTimer({
  authenticated,
  ready,
  showContent,
  addRandomPrompt,
}: RandomPromptApiTimerOptions) {
  useEffect(() => {
    // Commented out random prompt functionality
    /*
    if (!authenticated && ready && showContent) {
      const getRandomInterval = () => Math.floor(Math.random() * 7500) + 1500;

      let timerId: NodeJS.Timeout;

      timerId = setTimeout(async function addPrompt() {
        await addRandomPrompt();
        timerId = setTimeout(addPrompt, getRandomInterval());
      }, getRandomInterval());

      return () => clearTimeout(timerId);
    }
    */
  }, [authenticated, ready, showContent, addRandomPrompt]);
}
