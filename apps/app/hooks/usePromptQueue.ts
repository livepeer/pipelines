import { useState, useCallback, useEffect } from "react";

type PromptItem = {
  text: string;
  seed: string;
  isUser: boolean;
};

interface UsePromptQueueOptions {
  initialPrompts: string[];
  otherPeoplePrompts: string[];
  highlightDuration?: number;
  maxQueueSize?: number;
  showContent: boolean;
}

export function usePromptQueue({
  initialPrompts,
  otherPeoplePrompts,
  highlightDuration = 5000,
  maxQueueSize = 5,
  showContent,
}: UsePromptQueueOptions) {
  // Queue system state
  const [promptQueue, setPromptQueue] = useState<PromptItem[]>([]);
  const [highlightedSince, setHighlightedSince] = useState<number>(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [displayedPrompts, setDisplayedPrompts] = useState(initialPrompts);
  const [promptAvatarSeeds, setPromptAvatarSeeds] = useState<string[]>(
    initialPrompts.map(
      (_, i) => `user-${i}-${Math.random().toString(36).substring(2, 8)}`,
    ),
  );
  const [userAvatarSeed] = useState(
    `user-${Math.random().toString(36).substring(2, 10)}`,
  );
  const [userPromptIndices, setUserPromptIndices] = useState<boolean[]>(
    initialPrompts.map(() => false),
  );

  const processNextPrompt = useCallback(() => {
    setIsProcessingQueue(true);

    setPromptQueue(prevQueue => {
      if (prevQueue.length === 0) {
        setIsProcessingQueue(false);
        return prevQueue;
      }

      const nextPrompt = prevQueue[0];
      const remainingQueue = prevQueue.slice(1);

      setDisplayedPrompts(prevPrompts => [
        nextPrompt.text,
        ...prevPrompts.slice(0, prevPrompts.length - 1),
      ]);

      setPromptAvatarSeeds(prevSeeds => [
        nextPrompt.seed,
        ...prevSeeds.slice(0, prevSeeds.length - 1),
      ]);

      setUserPromptIndices(prevIndices => [
        nextPrompt.isUser,
        ...prevIndices.slice(0, prevIndices.length - 1),
      ]);

      setHighlightedSince(Date.now());

      return remainingQueue;
    });
  }, []);

  useEffect(() => {
    if (!showContent) return;

    const now = Date.now();
    const timeHighlighted = now - highlightedSince;

    if (
      (highlightedSince === 0 || timeHighlighted >= highlightDuration) &&
      promptQueue.length > 0 &&
      !isProcessingQueue
    ) {
      processNextPrompt();
    }

    const timer = setTimeout(() => {
      if (
        highlightedSince > 0 &&
        Date.now() - highlightedSince >= highlightDuration &&
        promptQueue.length > 0
      ) {
        processNextPrompt();
      }
      setIsProcessingQueue(false);
    }, highlightDuration);

    return () => clearTimeout(timer);
  }, [
    highlightedSince,
    promptQueue,
    processNextPrompt,
    showContent,
    isProcessingQueue,
    highlightDuration,
  ]);

  const addToPromptQueue = useCallback(
    (promptText: string, seed: string, isUser: boolean) => {
      if (!showContent) return;

      setPromptQueue(prevQueue => {
        if (prevQueue.length >= maxQueueSize) {
          return prevQueue;
        }

        return [...prevQueue, { text: promptText, seed, isUser }];
      });

      if (highlightedSince === 0) {
        processNextPrompt();
      }
    },
    [showContent, highlightedSince, processNextPrompt, maxQueueSize],
  );

  const addRandomPrompt = useCallback(() => {
    if (!showContent) return;

    const randomIndex = Math.floor(Math.random() * otherPeoplePrompts.length);
    const randomPrompt = otherPeoplePrompts[randomIndex];
    const randomSeed = `user-${Math.random().toString(36).substring(2, 8)}`;

    addToPromptQueue(randomPrompt, randomSeed, false);
  }, [otherPeoplePrompts, showContent, addToPromptQueue]);

  useEffect(() => {
    if (displayedPrompts.length > 0 && showContent) {
      setHighlightedSince(Date.now());
    }
  }, [showContent, displayedPrompts.length]);

  return {
    promptQueue,
    displayedPrompts,
    promptAvatarSeeds,
    userPromptIndices,
    userAvatarSeed,
    addToPromptQueue,
    addRandomPrompt,
    highlightedSince,
    isProcessingQueue,
  };
}
