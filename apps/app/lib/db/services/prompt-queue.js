"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetProcessingFlag = exports.cleanupOldPrompts = exports.processNextPrompt = exports.addToPromptQueue = exports.getPromptState = exports.initializePromptState = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const __1 = require("..");
const prompt_queue_1 = require("../schema/prompt-queue");
const initializePromptState = async (initialPrompts) => {
    const promptAvatarSeeds = initialPrompts.map((_, i) => `user-${i}-${Math.random().toString(36).substring(2, 8)}`);
    const userPromptIndices = initialPrompts.map(() => false);
    const promptSessionIds = initialPrompts.map(() => "");
    await (0, __1.withDbClient)(async (dbClient) => {
        const existingState = await dbClient
            .select()
            .from(prompt_queue_1.promptState)
            .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptState.id, "main"))
            .limit(1);
        if (existingState.length === 0) {
            await dbClient.insert(prompt_queue_1.promptState).values({
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
exports.initializePromptState = initializePromptState;
const getPromptState = async (frontendDisplaySize = 5) => {
    const currentState = await __1.db
        .select()
        .from(prompt_queue_1.promptState)
        .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptState.id, "main"))
        .limit(1);
    if (currentState.length === 0) {
        throw new Error("Prompt state not initialized");
    }
    const queueItems = await __1.db
        .select()
        .from(prompt_queue_1.promptQueue)
        .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptQueue.processed, false))
        .orderBy(prompt_queue_1.promptQueue.position)
        .limit(frontendDisplaySize);
    const promptQueueItems = queueItems.map(item => ({
        text: item.text,
        seed: item.seed,
        isUser: item.isUser,
        timestamp: item.timestamp.getTime(),
        sessionId: item.sessionId || undefined,
    }));
    return {
        displayedPrompts: currentState[0].displayedPrompts,
        promptAvatarSeeds: currentState[0].promptAvatarSeeds,
        userPromptIndices: currentState[0].userPromptIndices,
        promptSessionIds: currentState[0].promptSessionIds,
        highlightedSince: currentState[0].highlightedSince.getTime(),
        promptQueue: promptQueueItems,
    };
};
exports.getPromptState = getPromptState;
const addToPromptQueue = async (promptText, seed, isUser, sessionId, maxQueueSize = 100) => {
    return await (0, __1.withDbClient)(async (dbClient) => {
        const countResult = await dbClient
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(prompt_queue_1.promptQueue)
            .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptQueue.processed, false));
        const currentCount = countResult[0].count;
        if (currentCount >= maxQueueSize) {
            return { success: false };
        }
        const maxPositionResult = await dbClient
            .select({ maxPosition: (0, drizzle_orm_1.sql) `max(position)` })
            .from(prompt_queue_1.promptQueue);
        const nextPosition = maxPositionResult[0].maxPosition !== null
            ? maxPositionResult[0].maxPosition + 1
            : 0;
        await dbClient.insert(prompt_queue_1.promptQueue).values({
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
exports.addToPromptQueue = addToPromptQueue;
const processNextPrompt = async (highlightDuration = 10000) => {
    return await (0, __1.withDbClient)(async (dbClient) => {
        const currentState = await dbClient
            .select()
            .from(prompt_queue_1.promptState)
            .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptState.id, "main"))
            .limit(1);
        if (currentState.length === 0) {
            return { success: false, processed: false, remainingItems: 0 };
        }
        if (currentState[0].isProcessing) {
            const countResult = await dbClient
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(prompt_queue_1.promptQueue)
                .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptQueue.processed, false));
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
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(prompt_queue_1.promptQueue)
                .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptQueue.processed, false));
            return {
                success: true,
                processed: false,
                remainingItems: countResult[0].count,
            };
        }
        const nextPrompt = await dbClient
            .select()
            .from(prompt_queue_1.promptQueue)
            .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptQueue.processed, false))
            .orderBy(prompt_queue_1.promptQueue.position)
            .limit(1);
        if (nextPrompt.length === 0) {
            return { success: true, processed: false, remainingItems: 0 };
        }
        await dbClient
            .update(prompt_queue_1.promptState)
            .set({
            isProcessing: true,
            lastUpdated: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptState.id, "main"));
        try {
            const promptItem = nextPrompt[0];
            const stateData = currentState[0];
            const displayedPrompts = [
                promptItem.text,
                ...stateData.displayedPrompts,
            ];
            const promptAvatarSeeds = [
                promptItem.seed,
                ...stateData.promptAvatarSeeds,
            ];
            const userPromptIndices = [
                promptItem.isUser,
                ...stateData.userPromptIndices,
            ];
            const promptSessionIds = [
                promptItem.sessionId || "",
                ...stateData.promptSessionIds,
            ];
            await dbClient
                .update(prompt_queue_1.promptState)
                .set({
                displayedPrompts,
                promptAvatarSeeds,
                userPromptIndices,
                promptSessionIds,
                highlightedSince: now,
                isProcessing: false,
                lastUpdated: now,
            })
                .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptState.id, "main"));
            await dbClient
                .update(prompt_queue_1.promptQueue)
                .set({
                processed: true,
                processedAt: now,
            })
                .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptQueue.id, promptItem.id));
            const countResult = await dbClient
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(prompt_queue_1.promptQueue)
                .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptQueue.processed, false));
            return {
                success: true,
                processed: true,
                remainingItems: countResult[0].count,
            };
        }
        catch (error) {
            // Reset processing flag in case of error
            await dbClient
                .update(prompt_queue_1.promptState)
                .set({
                isProcessing: false,
                lastUpdated: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptState.id, "main"));
            console.error("Error processing prompt:", error);
            return { success: false, processed: false, remainingItems: 0 };
        }
    });
};
exports.processNextPrompt = processNextPrompt;
const cleanupOldPrompts = async (maxAgeHours = 24) => {
    return await (0, __1.withDbClient)(async (dbClient) => {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);
        const result = await dbClient
            .delete(prompt_queue_1.promptQueue)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(prompt_queue_1.promptQueue.processed, true), (0, drizzle_orm_1.lte)(prompt_queue_1.promptQueue.processedAt, cutoffDate)))
            .returning();
        return result.length;
    });
};
exports.cleanupOldPrompts = cleanupOldPrompts;
const resetProcessingFlag = async (stuckTimeoutMinutes = 5) => {
    return await (0, __1.withDbClient)(async (dbClient) => {
        const stateData = await dbClient
            .select()
            .from(prompt_queue_1.promptState)
            .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptState.id, "main"))
            .limit(1);
        if (stateData.length === 0 || !stateData[0].isProcessing) {
            return false;
        }
        const lastUpdated = stateData[0].lastUpdated;
        const now = new Date();
        const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        if (minutesSinceUpdate < stuckTimeoutMinutes) {
            return false;
        }
        await dbClient
            .update(prompt_queue_1.promptState)
            .set({
            isProcessing: false,
            lastUpdated: now,
        })
            .where((0, drizzle_orm_1.eq)(prompt_queue_1.promptState.id, "main"));
        return true;
    });
};
exports.resetProcessingFlag = resetProcessingFlag;
