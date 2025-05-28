import { PromptItem, PromptState } from "./types";
import {
  addToPromptQueue as dbAddToPromptQueue,
  getPromptState as dbGetPromptState,
  processNextPrompt,
  initializePromptState,
  resetProcessingFlag,
  cleanupOldPrompts,
} from "../../../lib/db/services/prompt-queue";
import { db } from "../../../lib/db";
import { streams } from "../../../lib/db/schema";
import { eq, inArray } from "drizzle-orm";

// Mock data - used for initializing the database
const initialPrompts = [
  "cyberpunk cityscape with neon lights --quality 3",
  "underwater scene with ((bioluminescent)) creatures --creativity 0.8",
  "forest with magical creatures and (((glowing plants))) --quality 2",
  "cosmic nebula with vibrant colors --creativity 0.7",
  "futuristic landscape with floating islands --quality 3",
  "post-apocalyptic desert with abandoned technology --quality 2.5",
  "steampunk airship battle in stormy skies --creativity 0.9",
  "crystalline cave with ((magical)) light reflections --quality 3",
  "ancient library with impossible architecture --creativity 0.8",
  "digital realm with data visualized as (((geometric structures))) --quality 2.5",
  "northern lights over snow-covered mountains --creativity 0.7",
  "microscopic view of exotic (((alien cells))) --quality 3",
  "ancient temple in a jungle with mystical fog --quality 2.8",
  "futuristic city with hovering vehicles and holographic ads --creativity 0.9",
  "magical underwater kingdom with merfolk architecture --quality 3",
  "cosmic gateway with swirling energy patterns --creativity 0.85",
  "crystal forest with rainbow light refractions --quality 2.7",
  "surreal dreamscape with floating islands and impossible physics --creativity 0.95",
  "ancient mechanical clockwork city --quality 3",
  "bioluminescent deep sea creatures in the abyss --creativity 0.8",
  "floating islands with waterfalls cascading into the void --quality 2.9",
  "enchanted forest with magical creatures and fairy lights --creativity 0.75",
  "cybernetic dragon with glowing circuit patterns --quality 3",
];

const otherPeoplePrompts = [
  "hyperrealistic portrait of an alien queen --quality 3",
  "fantasy castle floating among clouds at sunset --creativity 0.8",
  "cybernetic ((animal)) with glowing parts --quality 2",
  "dreamlike surreal landscape with impossible physics --creativity 0.9",
  "ancient ruins overgrown with (((luminescent plants))) --quality 3",
  "deep sea creature inspired by ((bioluminescent)) life --quality 2.5",
  "clockwork automaton with intricate mechanical details --creativity 0.8",
  "volcanic landscape with rivers of glowing (((molten lava))) --quality 3",
  "cosmic deity with stars and galaxies as part of its form --creativity 0.9",
  "psychedelic dreamscape with fractals and impossible colors --quality 2.5",
  "biomechanical fusion of nature and ((advanced technology)) --creativity 0.8",
  "crystal palace with rainbow light refractions --quality 3",
  "ancient temple in a jungle with mystical fog --quality 2.8",
  "futuristic city with hovering vehicles and holographic ads --creativity 0.9",
  "magical underwater kingdom with merfolk architecture --quality 3",
  "cosmic gateway with swirling energy patterns --creativity 0.85",
  "crystal forest with rainbow light refractions --quality 2.7",
  "surreal dreamscape with floating islands and impossible physics --creativity 0.95",
  "ancient mechanical clockwork city --quality 3",
  "bioluminescent deep sea creatures in the abyss --creativity 0.8",
  "floating islands with waterfalls cascading into the void --quality 2.9",
  "enchanted forest with magical creatures and fairy lights --creativity 0.75",
  "cybernetic dragon with glowing circuit patterns --quality 3",
];

const HIGHLIGHT_DURATION = 10000;
const MAX_QUEUE_SIZE = 100;
const FRONTEND_DISPLAY_SIZE = 20;
const TARGET_STREAM_KEYS =
  (process.env.NEXT_PUBLIC_MULTIPLAYER_STREAM_KEY as string)
    ?.split(",")
    ?.map(key => key.trim())
    ?.filter(key => key.length > 0) || [];
const RANDOM_PROMPT_INTERVAL = 20000;
const REAPPLY_INTERVAL = 60000; // 1 minute

// Track when the last prompt was applied
let lastPromptAppliedAt = 0;
let lastAppliedPrompt: string | null = null;

const initializeDb = async () => {
  try {
    await initializePromptState(initialPrompts);
    console.log(
      `[${new Date().toISOString()}] Database initialized with initial prompts`,
    );
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

if (typeof window === "undefined") {
  initializeDb().catch(console.error);

  setInterval(
    async () => {
      try {
        const wasReset = await resetProcessingFlag(5);
        if (wasReset) {
          console.log(
            `[${new Date().toISOString()}] Reset stuck processing flag`,
          );
        }
      } catch (error) {
        console.error("Error resetting processing flag:", error);
      }
    },
    5 * 60 * 1000,
  );

  setInterval(
    async () => {
      try {
        const deletedCount = await cleanupOldPrompts(24);
        if (deletedCount > 0) {
          console.log(
            `[${new Date().toISOString()}] Cleaned up ${deletedCount} old processed prompts`,
          );
        }
      } catch (error) {
        console.error("Error cleaning up old prompts:", error);
      }
    },
    60 * 60 * 1000,
  );
  /* disable reapply prompt worker
  setInterval(async () => {
    try {
      const now = Date.now();
      if (lastAppliedPrompt && now - lastPromptAppliedAt > REAPPLY_INTERVAL) {
        console.log(
          `[${new Date().toISOString()}] No prompt activity for ${Math.floor(
            (now - lastPromptAppliedAt) / 1000,
          )} seconds, reapplying last prompt: ${lastAppliedPrompt}`,
        );
        await applyPromptToStream(lastAppliedPrompt);
      } else if (!lastAppliedPrompt) {
        const currentState = await dbGetPromptState();
        if (currentState.displayedPrompts.length > 0) {
          lastAppliedPrompt = currentState.displayedPrompts[0];
          console.log(
            `[${new Date().toISOString()}] No last prompt available, using current displayed prompt: ${lastAppliedPrompt}`,
          );
          await applyPromptToStream(lastAppliedPrompt);
          lastPromptAppliedAt = now;
        }
      }
    } catch (error) {
      console.error("Error in reapply prompt worker:", error);
    }
  }, REAPPLY_INTERVAL); */
}

const applyPromptToStream = async (promptText: string) => {
  if (typeof window !== "undefined") {
    console.log(
      "Client-side environment detected, skipping prompt application",
    );
    return;
  }

  if (!TARGET_STREAM_KEYS || TARGET_STREAM_KEYS.length === 0) {
    console.error("No target stream keys configured");
    return;
  }

  const MAX_RETRIES = 3;

  // Apply prompt to all streams simultaneously
  const applyToAllStreams = async (): Promise<boolean> => {
    try {
      if (
        !process.env.STREAM_STATUS_ENDPOINT_USER ||
        !process.env.STREAM_STATUS_ENDPOINT_PASSWORD
      ) {
        console.error("Missing authentication environment variables");
        return false;
      }

      // Get all stream information from database
      const streams_data = await db
        .select({
          streamKey: streams.streamKey,
          gatewayHost: streams.gatewayHost,
        })
        .from(streams)
        .where(inArray(streams.streamKey, TARGET_STREAM_KEYS))
        .limit(TARGET_STREAM_KEYS.length);

      console.log(">>", streams_data);

      if (!streams_data || streams_data.length === 0) {
        console.error(
          `No streams found for keys: ${TARGET_STREAM_KEYS.join(", ")}`,
        );
        return false;
      }

      // Create a map of streamKey to gatewayHost for easy lookup
      const streamMap = new Map(
        streams_data.map(stream => [stream.streamKey, stream.gatewayHost]),
      );

      let quality = 3;
      let creativity = 0.6;

      let cleanedPromptText = promptText;

      const qualityMatch = promptText.match(/--quality\s+(\d+(\.\d+)?)/);
      if (qualityMatch && qualityMatch[1]) {
        const parsedQuality = parseFloat(qualityMatch[1]);
        if (!isNaN(parsedQuality) && parsedQuality > 0) {
          quality = Math.min(Math.max(parsedQuality, 1), 5);
          console.log(
            `[${new Date().toISOString()}] Using quality parameter:`,
            quality,
          );
        }
        cleanedPromptText = cleanedPromptText
          .replace(qualityMatch[0], "")
          .trim();
      }

      const creativityMatch = promptText.match(/--creativity\s+(\d+(\.\d+)?)/);
      if (creativityMatch && creativityMatch[1]) {
        const parsedCreativity = parseFloat(creativityMatch[1]);
        if (!isNaN(parsedCreativity)) {
          creativity = Math.min(Math.max(parsedCreativity, 0.1), 1.0);
          console.log(
            `[${new Date().toISOString()}] Using creativity parameter:`,
            creativity,
          );
        }
        cleanedPromptText = cleanedPromptText
          .replace(creativityMatch[0], "")
          .trim();
      }

      console.log(
        `[${new Date().toISOString()}] Applying prompt to ${TARGET_STREAM_KEYS.length} streams with quality=${quality}, creativity=${creativity}`,
      );

      const params = {
        prompt: {
          "1": {
            _meta: {
              title: "Load Image",
            },
            inputs: {
              image: "example.png",
            },
            class_type: "LoadImage",
          },
          "2": {
            _meta: {
              title: "Depth Anything Tensorrt",
            },
            inputs: {
              engine: "depth_anything_vitl14-fp16.engine",
              images: ["1", 0],
            },
            class_type: "DepthAnythingTensorrt",
          },
          "3": {
            _meta: {
              title: "TensorRT Loader",
            },
            inputs: {
              unet_name:
                "static-dreamshaper8_SD15_$stat-b-1-h-512-w-512_00001_.engine",
              model_type: "SD15",
            },
            class_type: "TensorRTLoader",
          },
          "5": {
            _meta: {
              title: "CLIP Text Encode (Prompt)",
            },
            inputs: {
              clip: ["23", 0],
              text: cleanedPromptText,
            },
            class_type: "CLIPTextEncode",
          },
          "6": {
            _meta: {
              title: "CLIP Text Encode (Prompt)",
            },
            inputs: {
              clip: ["23", 0],
              text: "",
            },
            class_type: "CLIPTextEncode",
          },
          "7": {
            _meta: {
              title: "KSampler",
            },
            inputs: {
              cfg: 1,
              seed: 785664736216738,
              model: ["24", 0],
              steps: quality,
              denoise: 1,
              negative: ["9", 1],
              positive: ["9", 0],
              scheduler: "normal",
              latent_image: ["16", 0],
              sampler_name: "lcm",
            },
            class_type: "KSampler",
          },
          "8": {
            _meta: {
              title: "Load ControlNet Model",
            },
            inputs: {
              control_net_name: "control_v11f1p_sd15_depth_fp16.safetensors",
            },
            class_type: "ControlNetLoader",
          },
          "9": {
            _meta: {
              title: "Apply ControlNet",
            },
            inputs: {
              image: ["2", 0],
              negative: ["6", 0],
              positive: ["5", 0],
              strength: creativity,
              control_net: ["10", 0],
              end_percent: 1,
              start_percent: 0,
            },
            class_type: "ControlNetApplyAdvanced",
          },
          "10": {
            _meta: {
              title: "TorchCompileLoadControlNet",
            },
            inputs: {
              mode: "reduce-overhead",
              backend: "inductor",
              fullgraph: false,
              controlnet: ["8", 0],
            },
            class_type: "TorchCompileLoadControlNet",
          },
          "11": {
            _meta: {
              title: "Load VAE",
            },
            inputs: {
              vae_name: "taesd",
            },
            class_type: "VAELoader",
          },
          "13": {
            _meta: {
              title: "TorchCompileLoadVAE",
            },
            inputs: {
              vae: ["11", 0],
              mode: "reduce-overhead",
              backend: "inductor",
              fullgraph: true,
              compile_decoder: true,
              compile_encoder: true,
            },
            class_type: "TorchCompileLoadVAE",
          },
          "14": {
            _meta: {
              title: "VAE Decode",
            },
            inputs: {
              vae: ["13", 0],
              samples: ["7", 0],
            },
            class_type: "VAEDecode",
          },
          "15": {
            _meta: {
              title: "Preview Image",
            },
            inputs: {
              images: ["14", 0],
            },
            class_type: "PreviewImage",
          },
          "16": {
            _meta: {
              title: "Empty Latent Image",
            },
            inputs: {
              width: 512,
              height: 512,
              batch_size: 1,
            },
            class_type: "EmptyLatentImage",
          },
          "23": {
            _meta: {
              title: "Load CLIP",
            },
            inputs: {
              type: "stable_diffusion",
              device: "default",
              clip_name: "CLIPText/model.fp16.safetensors",
            },
            class_type: "CLIPLoader",
          },
          "24": {
            _meta: {
              title: "Feature Bank Attention Processor",
            },
            inputs: {
              model: ["3", 0],
              use_feature_injection: false,
              feature_cache_interval: 4,
              feature_bank_max_frames: 4,
              feature_injection_strength: 0.8,
              feature_similarity_threshold: 0.98,
            },
            class_type: "FeatureBankAttentionProcessor",
          },
        },
      };

      const credentials = Buffer.from(
        `${process.env.STREAM_STATUS_ENDPOINT_USER}:${process.env.STREAM_STATUS_ENDPOINT_PASSWORD}`,
      ).toString("base64");

      console.log(">>", credentials);

      const requests = TARGET_STREAM_KEYS.map(async streamKey => {
        const gatewayHost = streamMap.get(streamKey);

        if (!gatewayHost) {
          console.error(`Gateway host not found for stream key: ${streamKey}`);
          return { streamKey, success: false, error: "Gateway host not found" };
        }

        try {
          console.log(`Applying prompt to stream: ${streamKey}`);
          console.log(`Using gateway host: ${gatewayHost}`);

          const apiUrl = `https://${gatewayHost}/live/video-to-video/${streamKey}/update`;
          console.log(`Making request to: ${apiUrl}`);

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
          });

          console.log(`API Response status for ${streamKey}:`, response.status);

          if (!response.ok) {
            const errorText = await response
              .text()
              .catch(() => "Failed to read error response");
            throw new Error(
              `Failed with status ${response.status}: ${errorText}`,
            );
          }

          console.log(`Successfully applied prompt to stream: ${streamKey}`);
          return { streamKey, success: true };
        } catch (error) {
          console.error(`Error applying prompt to stream ${streamKey}:`, error);
          return {
            streamKey,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      const results = await Promise.all(requests);

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      console.log(
        `Applied prompt to ${successCount}/${totalCount} streams successfully`,
      );

      if (successCount === 0) {
        console.error("Failed to apply prompt to any streams");
        return false;
      }

      if (successCount < totalCount) {
        console.warn(
          `Only applied prompt to ${successCount}/${totalCount} streams`,
        );
        results
          .filter(r => !r.success)
          .forEach(r => {
            console.error(`Failed for stream ${r.streamKey}: ${r.error}`);
          });
      }

      return true;
    } catch (error) {
      console.error("Error in applyToAllStreams:", error);
      return false;
    }
  };

  let currentRetry = 0;
  while (currentRetry < MAX_RETRIES) {
    console.log(
      `[${new Date().toISOString()}] Prompt application attempt ${currentRetry + 1}/${MAX_RETRIES}`,
    );

    const success = await applyToAllStreams();
    if (success) {
      // Update last applied prompt tracking
      lastAppliedPrompt = promptText;
      lastPromptAppliedAt = Date.now();
      return;
    }

    currentRetry++;

    if (currentRetry < MAX_RETRIES) {
      // Exponential backoff with jitter: 2^retry * 500ms + random jitter
      const delay = Math.floor(2 ** currentRetry * 500 + Math.random() * 300);
      console.log(`[${new Date().toISOString()}] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(
    `[${new Date().toISOString()}] Failed to apply prompt after ${MAX_RETRIES} attempts:`,
    promptText,
  );
};

export const checkAndProcessQueue = async (): Promise<void> => {
  try {
    console.log(`[${new Date().toISOString()}] Checking prompt queue`);

    const result = await processNextPrompt(HIGHLIGHT_DURATION);

    if (result.processed) {
      console.log(`[${new Date().toISOString()}] Processed next prompt`);

      const currentState = await dbGetPromptState();
      if (currentState.displayedPrompts.length > 0) {
        await applyPromptToStream(currentState.displayedPrompts[0]);
      }

      if (result.remainingItems > 0) {
        console.log(
          `[${new Date().toISOString()}] ${result.remainingItems} items remaining in queue, scheduling next processing`,
        );
        setTimeout(() => {
          checkAndProcessQueue().catch(console.error);
        }, HIGHLIGHT_DURATION + 500);
      }
    } else if (!result.success) {
      console.error(
        `[${new Date().toISOString()}] Failed to process next prompt`,
      );
    } else {
      console.log(
        `[${new Date().toISOString()}] No prompt ready to process (${result.remainingItems} in queue)`,
      );

      if (result.remainingItems > 0) {
        console.log(
          `[${new Date().toISOString()}] Scheduling next check for ${result.remainingItems} remaining items`,
        );
        setTimeout(() => {
          checkAndProcessQueue().catch(console.error);
        }, HIGHLIGHT_DURATION + 500);
      }
    }
  } catch (error) {
    console.error("Error checking and processing queue:", error);
  }
};

export const getPromptState = async (): Promise<PromptState> => {
  try {
    const state = await dbGetPromptState(FRONTEND_DISPLAY_SIZE);
    return state;
  } catch (error) {
    console.error("Error getting prompt state:", error);

    return {
      promptQueue: [],
      displayedPrompts: [],
      promptAvatarSeeds: [],
      userPromptIndices: [],
      promptSessionIds: [],
      highlightedSince: Date.now(),
    };
  }
};

export const addToPromptQueue = async (
  promptText: string,
  seed: string,
  isUser: boolean,
  sessionId?: string,
): Promise<{ success: boolean; queuePosition?: number }> => {
  try {
    const result = await dbAddToPromptQueue(
      promptText,
      seed,
      isUser,
      sessionId,
      MAX_QUEUE_SIZE,
    );

    if (result.success) {
      console.log(
        `[${new Date().toISOString()}] Added prompt to queue: ${promptText}`,
      );

      setTimeout(() => {
        checkAndProcessQueue().catch(console.error);
      }, 0);
    }

    return result;
  } catch (error) {
    console.error("Error adding to prompt queue:", error);
    return { success: false };
  }
};

export const addRandomPrompt = async (): Promise<{
  success: boolean;
  queuePosition?: number;
}> => {
  const randomIndex = Math.floor(Math.random() * otherPeoplePrompts.length);
  const randomPrompt = otherPeoplePrompts[randomIndex];
  const randomSeed = `user-${Math.random().toString(36).substring(2, 8)}`;

  return addToPromptQueue(randomPrompt, randomSeed, false);
};
