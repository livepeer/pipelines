import { desc, eq, sql, and, gt, isNull, lte } from "drizzle-orm";
import {
  type PromptItem,
  type PromptState as PromptStateType,
} from "../../../app/api/prompts/types";
import { db, withDbClient } from "..";
import { promptQueue, promptState } from "../schema/prompt-queue";

export const initializePromptState = async (
  initialPrompts: string[],
): Promise<void> => {
  const promptAvatarSeeds = initialPrompts.map(
    (_, i) => `user-${i}-${Math.random().toString(36).substring(2, 8)}`,
  );

  const userPromptIndices = initialPrompts.map(() => false);

  const promptSessionIds = initialPrompts.map(() => "");

  await withDbClient(async dbClient => {
    const existingState = await dbClient
      .select()
      .from(promptState)
      .where(eq(promptState.id, "main"))
      .limit(1);

    if (existingState.length === 0) {
      await dbClient.insert(promptState).values({
        id: "main",
        displayedPrompts: initialPrompts,
        promptAvatarSeeds,
        userPromptIndices,
        promptSessionIds,
        highlightedSince: new Date(),
        isProcessing: false,
      });
    }
  });
};

export const getPromptState = async (
  frontendDisplaySize: number = 5,
): Promise<PromptStateType> => {
  const currentState = await db
    .select()
    .from(promptState)
    .where(eq(promptState.id, "main"))
    .limit(1);

  if (currentState.length === 0) {
    throw new Error("Prompt state not initialized");
  }

  const queueItems = await db
    .select()
    .from(promptQueue)
    .where(eq(promptQueue.processed, false))
    .orderBy(promptQueue.position)
    .limit(frontendDisplaySize);

  const promptQueueItems: PromptItem[] = queueItems.map(item => ({
    text: item.text,
    seed: item.seed,
    isUser: item.isUser,
    timestamp: item.timestamp.getTime(),
    sessionId: item.sessionId || undefined,
  }));

  return {
    displayedPrompts: currentState[0].displayedPrompts as string[],
    promptAvatarSeeds: currentState[0].promptAvatarSeeds as string[],
    userPromptIndices: currentState[0].userPromptIndices as boolean[],
    promptSessionIds: currentState[0].promptSessionIds as string[],
    highlightedSince: currentState[0].highlightedSince.getTime(),
    promptQueue: promptQueueItems,
  };
};

export const addToPromptQueue = async (
  promptText: string,
  seed: string,
  isUser: boolean,
  sessionId?: string,
  maxQueueSize: number = 100,
): Promise<{ success: boolean; queuePosition?: number }> => {
  return await withDbClient(async dbClient => {
    const countResult = await dbClient
      .select({ count: sql<number>`count(*)` })
      .from(promptQueue)
      .where(eq(promptQueue.processed, false));

    const currentCount = countResult[0].count;

    if (currentCount >= maxQueueSize) {
      return { success: false };
    }

    const maxPositionResult = await dbClient
      .select({ maxPosition: sql<number>`max(position)` })
      .from(promptQueue);

    const nextPosition =
      maxPositionResult[0].maxPosition !== null
        ? maxPositionResult[0].maxPosition + 1
        : 0;

    await dbClient.insert(promptQueue).values({
      text: promptText,
      seed,
      isUser,
      sessionId,
      position: nextPosition,
      timestamp: new Date(),
      processed: false,
    });

    return {
      success: true,
      queuePosition: nextPosition,
    };
  });
};

export const processNextPrompt = async (
  highlightDuration: number = 10000,
): Promise<{
  success: boolean;
  processed: boolean;
  remainingItems: number;
}> => {
  return await withDbClient(async dbClient => {
    const currentState = await dbClient
      .select()
      .from(promptState)
      .where(eq(promptState.id, "main"))
      .limit(1);

    if (currentState.length === 0) {
      return { success: false, processed: false, remainingItems: 0 };
    }

    if (currentState[0].isProcessing) {
      const countResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(promptQueue)
        .where(eq(promptQueue.processed, false));

      return {
        success: true,
        processed: false,
        remainingItems: countResult[0].count,
      };
    }

    const highlightedSince = currentState[0].highlightedSince;
    const now = new Date();
    const timeSinceHighlight = now.getTime() - highlightedSince.getTime();

    if (timeSinceHighlight < highlightDuration) {
      const countResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(promptQueue)
        .where(eq(promptQueue.processed, false));

      return {
        success: true,
        processed: false,
        remainingItems: countResult[0].count,
      };
    }

    const nextPrompt = await dbClient
      .select()
      .from(promptQueue)
      .where(eq(promptQueue.processed, false))
      .orderBy(promptQueue.position)
      .limit(1);

    if (nextPrompt.length === 0) {
      return { success: true, processed: false, remainingItems: 0 };
    }

    await dbClient
      .update(promptState)
      .set({
        isProcessing: true,
        lastUpdated: new Date(),
      })
      .where(eq(promptState.id, "main"));

    try {
      const promptItem = nextPrompt[0];
      const stateData = currentState[0];

      const displayedPrompts = [
        promptItem.text,
        ...(stateData.displayedPrompts as string[]).slice(
          0,
          (stateData.displayedPrompts as string[]).length - 1,
        ),
      ];

      const promptAvatarSeeds = [
        promptItem.seed,
        ...(stateData.promptAvatarSeeds as string[]).slice(
          0,
          (stateData.promptAvatarSeeds as string[]).length - 1,
        ),
      ];

      const userPromptIndices = [
        promptItem.isUser,
        ...(stateData.userPromptIndices as boolean[]).slice(
          0,
          (stateData.userPromptIndices as boolean[]).length - 1,
        ),
      ];

      const promptSessionIds = [
        promptItem.sessionId || "",
        ...(stateData.promptSessionIds as string[]).slice(
          0,
          (stateData.promptSessionIds as string[]).length - 1,
        ),
      ];

      await dbClient
        .update(promptState)
        .set({
          displayedPrompts,
          promptAvatarSeeds,
          userPromptIndices,
          promptSessionIds,
          highlightedSince: now,
          isProcessing: false,
          lastUpdated: now,
        })
        .where(eq(promptState.id, "main"));

      await dbClient
        .update(promptQueue)
        .set({
          processed: true,
          processedAt: now,
        })
        .where(eq(promptQueue.id, promptItem.id));

      const countResult = await dbClient
        .select({ count: sql<number>`count(*)` })
        .from(promptQueue)
        .where(eq(promptQueue.processed, false));

      return {
        success: true,
        processed: true,
        remainingItems: countResult[0].count,
      };
    } catch (error) {
      // Reset processing flag in case of error
      await dbClient
        .update(promptState)
        .set({
          isProcessing: false,
          lastUpdated: new Date(),
        })
        .where(eq(promptState.id, "main"));

      console.error("Error processing prompt:", error);
      return { success: false, processed: false, remainingItems: 0 };
    }
  });
};

export const cleanupOldPrompts = async (
  maxAgeHours: number = 24,
): Promise<number> => {
  return await withDbClient(async dbClient => {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    const result = await dbClient
      .delete(promptQueue)
      .where(
        and(
          eq(promptQueue.processed, true),
          lte(promptQueue.processedAt as any, cutoffDate),
        ),
      )
      .returning();

    return result.length;
  });
};

export const resetProcessingFlag = async (
  stuckTimeoutMinutes: number = 5,
): Promise<boolean> => {
  return await withDbClient(async dbClient => {
    const stateData = await dbClient
      .select()
      .from(promptState)
      .where(eq(promptState.id, "main"))
      .limit(1);

    if (stateData.length === 0 || !stateData[0].isProcessing) {
      return false;
    }

    const lastUpdated = stateData[0].lastUpdated;
    const now = new Date();
    const minutesSinceUpdate =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

    if (minutesSinceUpdate < stuckTimeoutMinutes) {
      return false;
    }

    await dbClient
      .update(promptState)
      .set({
        isProcessing: false,
        lastUpdated: now,
      })
      .where(eq(promptState.id, "main"));

    return true;
  });
};
