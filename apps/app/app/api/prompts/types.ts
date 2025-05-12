import { z } from "zod";

export type PromptItem = {
  text: string;
  seed: string;
  isUser: boolean;
  timestamp: number;
  sessionId?: string;
};

export type PromptState = {
  promptQueue: PromptItem[];
  displayedPrompts: string[];
  promptAvatarSeeds: string[];
  userPromptIndices: boolean[];
  promptSessionIds?: string[];
  highlightedSince: number;
};

export const AddPromptSchema = z.object({
  text: z.string(),
  seed: z.string(),
  isUser: z.boolean(),
  sessionId: z.string().optional(),
});

export type AddPromptRequest = z.infer<typeof AddPromptSchema>;

export type GetPromptStateResponse = PromptState;
export type AddPromptResponse = { success: boolean; queuePosition?: number };
