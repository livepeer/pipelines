import { PromptItem, PromptState } from "./types";

// Mock data
const initialPrompts = [
  "cyberpunk cityscape with neon lights --quality 3",
  "underwater scene with ((bioluminescent)) creatures --creativity 0.8",
  "forest with magical creatures and (((glowing plants))) --quality 2",
  "cosmic nebula with vibrant colors --creativity 0.7",
  "futuristic landscape with floating islands --quality 3",
];

const otherPeoplePrompts = [
  "hyperrealistic portrait of an alien queen --quality 3",
  "fantasy castle floating among clouds at sunset --creativity 0.8",
  "cybernetic ((animal)) with glowing parts --quality 2",
  "dreamlike surreal landscape with impossible physics --creativity 0.9",
  "ancient ruins overgrown with (((luminescent plants))) --quality 3",
];

const HIGHLIGHT_DURATION = 5000;
const MAX_QUEUE_SIZE = 5;

const createInitialState = (): PromptState => ({
  promptQueue: [],
  displayedPrompts: initialPrompts,
  promptAvatarSeeds: initialPrompts.map(
    (_, i) => `user-${i}-${Math.random().toString(36).substring(2, 8)}`,
  ),
  userPromptIndices: initialPrompts.map(() => false),
  highlightedSince: Date.now(),
});

let promptState = createInitialState();
let isProcessingQueue = false;
let processingTimer: NodeJS.Timeout | null = null;

const processNextPrompt = () => {
  isProcessingQueue = true;

  if (promptState.promptQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }

  const nextPrompt = promptState.promptQueue[0];
  const remainingQueue = promptState.promptQueue.slice(1);

  promptState = {
    ...promptState,
    promptQueue: remainingQueue,
    displayedPrompts: [
      nextPrompt.text,
      ...promptState.displayedPrompts.slice(
        0,
        promptState.displayedPrompts.length - 1,
      ),
    ],
    promptAvatarSeeds: [
      nextPrompt.seed,
      ...promptState.promptAvatarSeeds.slice(
        0,
        promptState.promptAvatarSeeds.length - 1,
      ),
    ],
    userPromptIndices: [
      nextPrompt.isUser,
      ...promptState.userPromptIndices.slice(
        0,
        promptState.userPromptIndices.length - 1,
      ),
    ],
    highlightedSince: Date.now(),
  };

  if (processingTimer) {
    clearTimeout(processingTimer);
  }

  if (remainingQueue.length > 0) {
    processingTimer = setTimeout(() => {
      isProcessingQueue = false;
      checkAndProcessQueue();
    }, HIGHLIGHT_DURATION);
  } else {
    isProcessingQueue = false;
  }
};

const checkAndProcessQueue = () => {
  const now = Date.now();
  const timeHighlighted = now - promptState.highlightedSince;

  if (
    (promptState.highlightedSince === 0 ||
      timeHighlighted >= HIGHLIGHT_DURATION) &&
    promptState.promptQueue.length > 0 &&
    !isProcessingQueue
  ) {
    processNextPrompt();
  }
};

export const addToPromptQueue = (
  promptText: string,
  seed: string,
  isUser: boolean,
): { success: boolean; queuePosition?: number } => {
  if (promptState.promptQueue.length >= MAX_QUEUE_SIZE) {
    return { success: false };
  }

  const newPrompt: PromptItem = {
    text: promptText,
    seed,
    isUser,
    timestamp: Date.now(),
  };

  promptState = {
    ...promptState,
    promptQueue: [...promptState.promptQueue, newPrompt],
  };

  const now = Date.now();
  if (
    promptState.highlightedSince === 0 ||
    now - promptState.highlightedSince >= HIGHLIGHT_DURATION
  ) {
    setTimeout(() => {
      checkAndProcessQueue();
    }, 0);
  }

  return {
    success: true,
    queuePosition: promptState.promptQueue.length - 1,
  };
};

export const addRandomPrompt = (): {
  success: boolean;
  queuePosition?: number;
} => {
  const randomIndex = Math.floor(Math.random() * otherPeoplePrompts.length);
  const randomPrompt = otherPeoplePrompts[randomIndex];
  const randomSeed = `user-${Math.random().toString(36).substring(2, 8)}`;

  return addToPromptQueue(randomPrompt, randomSeed, false);
};

export const getPromptState = (): PromptState => {
  return { ...promptState };
};

const initBackgroundTimer = () => {
  setInterval(() => {
    checkAndProcessQueue();
  }, 1000);
};

initBackgroundTimer();
