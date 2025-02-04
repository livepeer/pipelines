import { z } from "zod";

const modelCardSchema = z
  .object({
    baseModel: z.string(),
    modelType: z.string(),
    license: z.string(),
    intendedUse: z.string(),
    trainingDataset: z.string().default("TBD"),
    evaluationResult: z.string().default("TBD"),
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

export const pipelineSchema = z.object({
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  last_used: z.date().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  is_private: z.boolean().default(true),
  validation_status: z.enum(['valid', 'invalid', 'processing', 'pending']).default('pending'),
  cover_image: z.string().url().nullable().optional(),
  type: z.string().default("comfyui"),
  comfy_ui_json: z.unknown().nullable().optional(),
  sample_code_repo: z.string().url().nullable().optional(),
  is_featured: z.boolean().default(false),
  sample_input_video: z.string().url().nullable().optional(),
  config: z.unknown().nullable().optional(),
  key: z.string().default("comfyui"),
  author: z.string(),
  model_card: modelCardSchema,
  prioritized_params: z.unknown().nullable().optional(),
  version: z
    .string()
    .default("1.0.0")
    .refine((version) => {
      const matches = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
      if (!matches) return false;
      const [_, major, minor, patch] = matches;
      return (
        !isNaN(Number(major)) && !isNaN(Number(minor)) && !isNaN(Number(patch))
      );
    }, "Version must be in format major.minor.patch where major, minor, and patch are valid numbers"),
});

export type PipelineSchema = z.infer<typeof pipelineSchema>;
