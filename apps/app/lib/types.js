"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipelineSchema = void 0;
const zod_1 = require("zod");
const modelCardSchema = zod_1.z
    .object({
    baseModel: zod_1.z.string(),
    modelType: zod_1.z.string(),
    license: zod_1.z.string(),
    intendedUse: zod_1.z.string(),
    trainingDataset: zod_1.z.string().default("TBD"),
    evaluationResult: zod_1.z.string().default("TBD"),
})
    .optional();
// const configSchema = z.object({
//   inputs: z.object({
//     primary: z.object({
//       id: z.string().optional(),
//       type: z.string().optional(),
//       label: z.string().optional(),
//       required: z.boolean().optional(),
//       fullWidth: z.boolean().optional(),
//       placeholder: z.string().optional(),
//       defaultValue: z.unknown(),
//     }),
//   }),
//   version: z.string().optional(),
//   metadata: z.object({
//     description: z.string().optional(),
//     requiredFields: z.array(z.string()).optional(),
//   }),
// });
exports.pipelineSchema = zod_1.z.object({
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
    last_used: zod_1.z.date().nullable().optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    is_private: zod_1.z.boolean().default(true),
    validation_status: zod_1.z
        .enum(["valid", "invalid", "processing", "pending"])
        .default("pending"),
    cover_image: zod_1.z.string().url().nullable().optional(),
    type: zod_1.z.string().default("comfyui"),
    comfy_ui_json: zod_1.z.unknown().nullable().optional(),
    sample_code_repo: zod_1.z.string().url().nullable().optional(),
    is_featured: zod_1.z.boolean().default(false),
    sample_input_video: zod_1.z.string().url().nullable().optional(),
    config: zod_1.z.unknown().nullable().optional(),
    key: zod_1.z.string().default("comfyui"),
    author: zod_1.z.string(),
    model_card: modelCardSchema,
    prioritized_params: zod_1.z.unknown().nullable().optional(),
    version: zod_1.z
        .string()
        .default("1.0.0")
        .refine(version => {
        const matches = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
        if (!matches)
            return false;
        const [_, major, minor, patch] = matches;
        return (!isNaN(Number(major)) && !isNaN(Number(minor)) && !isNaN(Number(patch)));
    }, "Version must be in format major.minor.patch where major, minor, and patch are valid numbers"),
});
