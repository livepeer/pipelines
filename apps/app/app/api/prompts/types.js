"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPromptSchema = void 0;
const zod_1 = require("zod");
exports.AddPromptSchema = zod_1.z.object({
    text: zod_1.z.string(),
    seed: zod_1.z.string(),
    isUser: zod_1.z.boolean(),
    sessionId: zod_1.z.string().optional(),
});
