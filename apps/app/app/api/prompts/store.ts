import { PromptItem, PromptState } from "./types";

// Declare a global namespace to hold our state
declare global {
  var promptState: PromptState;
  var isProcessingQueue: boolean;
  var processingTimer: NodeJS.Timeout | null;
  var randomPromptTimer: NodeJS.Timeout | null;
  var lastInitTime: number;
}

// Mock data
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
];

const HIGHLIGHT_DURATION = 10000;
const MAX_QUEUE_SIZE = 100;
const FRONTEND_DISPLAY_SIZE = 5;
const TARGET_STREAM_KEY = "stk_W5K2ujsi2s9etRku";
const RANDOM_PROMPT_INTERVAL = 20000;
const INIT_INTERVAL = 60 * 60 * 1000; // 1 hour

const createInitialState = (): PromptState => ({
  promptQueue: [],
  displayedPrompts: initialPrompts,
  promptAvatarSeeds: initialPrompts.map(
    (_, i) => `user-${i}-${Math.random().toString(36).substring(2, 8)}`,
  ),
  userPromptIndices: initialPrompts.map(() => false),
  promptSessionIds: initialPrompts.map(() => ""),
  highlightedSince: Date.now(),
});

// Initialize the global state if it doesn't exist or if it's too old
if (
  !global.promptState ||
  !global.lastInitTime ||
  Date.now() - global.lastInitTime > INIT_INTERVAL
) {
  global.promptState = createInitialState();
  global.isProcessingQueue = false;
  global.processingTimer = null;
  global.randomPromptTimer = null;
  global.lastInitTime = Date.now();

  console.log(`[${new Date().toISOString()}] Initialized global prompt state`);
} else {
  console.log(
    `[${new Date().toISOString()}] Reusing existing global prompt state, age: ${Math.floor((Date.now() - global.lastInitTime) / 1000)}s`,
  );
}

const applyPromptToStream = async (promptText: string) => {
  if (typeof window !== "undefined") {
    console.log(
      "Client-side environment detected, skipping prompt application",
    );
    return;
  }

  try {
    if (
      !process.env.STREAM_STATUS_ENDPOINT_USER ||
      !process.env.STREAM_STATUS_ENDPOINT_PASSWORD
    ) {
      console.error("Missing authentication environment variables");
      return;
    }

    const CORRECT_GATEWAY_HOST =
      "prg-staging-ai-staging-livepeer-ai-gateway-0.livepeer.monster";

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
            text: promptText,
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
            steps: 3,
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
            strength: 0.6,
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

    console.log("Applying prompt to stream:", TARGET_STREAM_KEY);
    console.log("Using correct gateway host:", CORRECT_GATEWAY_HOST);

    const apiUrl = `https://${CORRECT_GATEWAY_HOST}/live/video-to-video/${TARGET_STREAM_KEY}/update`;
    console.log("Making request to:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    console.log("API Response status:", response.status);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Failed to read error response");
      throw new Error(`Failed with status ${response.status}: ${errorText}`);
    }

    console.log("Successfully applied prompt to stream:", promptText);
  } catch (error) {
    console.error("Error applying prompt to stream:", error);
  }
};

const processNextPrompt = () => {
  global.isProcessingQueue = true;

  if (global.promptState.promptQueue.length === 0) {
    global.isProcessingQueue = false;
    return;
  }

  const nextPrompt = global.promptState.promptQueue[0];
  const remainingQueue = global.promptState.promptQueue.slice(1);

  global.promptState = {
    ...global.promptState,
    promptQueue: remainingQueue,
    displayedPrompts: [
      nextPrompt.text,
      ...global.promptState.displayedPrompts.slice(
        0,
        global.promptState.displayedPrompts.length - 1,
      ),
    ],
    promptAvatarSeeds: [
      nextPrompt.seed,
      ...global.promptState.promptAvatarSeeds.slice(
        0,
        global.promptState.promptAvatarSeeds.length - 1,
      ),
    ],
    userPromptIndices: [
      nextPrompt.isUser,
      ...global.promptState.userPromptIndices.slice(
        0,
        global.promptState.userPromptIndices.length - 1,
      ),
    ],
    promptSessionIds: [
      nextPrompt.sessionId || "",
      ...(global.promptState.promptSessionIds
        ? global.promptState.promptSessionIds.slice(
            0,
            global.promptState.promptSessionIds.length - 1,
          )
        : []),
    ],
    highlightedSince: Date.now(),
  };

  applyPromptToStream(nextPrompt.text);

  if (global.processingTimer) {
    clearTimeout(global.processingTimer);
  }

  if (remainingQueue.length > 0) {
    global.processingTimer = setTimeout(() => {
      global.isProcessingQueue = false;
      checkAndProcessQueue();
    }, HIGHLIGHT_DURATION);
  } else {
    global.isProcessingQueue = false;
  }
};

export const checkAndProcessQueue = () => {
  if (global.isProcessingQueue) {
    console.log(
      `[${new Date().toISOString()}] Queue processing already in progress, skipping`,
    );
    return;
  }

  if (global.promptState.promptQueue.length === 0) {
    console.log(
      `[${new Date().toISOString()}] Queue is empty, nothing to process`,
    );
    return;
  }

  const now = Date.now();
  const timeSinceHighlight = now - global.promptState.highlightedSince;

  console.log(
    `[${new Date().toISOString()}] Checking queue: ${global.promptState.promptQueue.length} items, time since last highlight: ${Math.floor(timeSinceHighlight / 1000)}s`,
  );

  if (
    global.promptState.highlightedSince === 0 ||
    timeSinceHighlight >= HIGHLIGHT_DURATION
  ) {
    console.log(`[${new Date().toISOString()}] Processing next prompt`);
    processNextPrompt();
  } else {
    console.log(
      `[${new Date().toISOString()}] Waiting for highlight duration to pass, ${Math.floor((HIGHLIGHT_DURATION - timeSinceHighlight) / 1000)}s remaining`,
    );
  }
};

export const getPromptState = (): PromptState => {
  const limitedQueue = global.promptState.promptQueue.slice(
    0,
    FRONTEND_DISPLAY_SIZE,
  );

  return {
    ...global.promptState,
    promptQueue: limitedQueue,
  };
};

export const addToPromptQueue = (
  promptText: string,
  seed: string,
  isUser: boolean,
  sessionId?: string,
): { success: boolean; queuePosition?: number } => {
  if (global.promptState.promptQueue.length >= MAX_QUEUE_SIZE) {
    return { success: false };
  }

  const newPrompt: PromptItem = {
    text: promptText,
    seed,
    isUser,
    timestamp: Date.now(),
    sessionId,
  };

  global.promptState = {
    ...global.promptState,
    promptQueue: [...global.promptState.promptQueue, newPrompt],
  };

  const now = Date.now();
  if (
    global.promptState.highlightedSince === 0 ||
    now - global.promptState.highlightedSince >= HIGHLIGHT_DURATION
  ) {
    setTimeout(() => {
      checkAndProcessQueue();
    }, 0);
  }

  return {
    success: true,
    queuePosition: global.promptState.promptQueue.length - 1,
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

if (typeof window === "undefined") {
  const initBackgroundTimer = () => {
    const checkInterval = setInterval(() => {
      checkAndProcessQueue();
    }, 1000);

    if (global.randomPromptTimer) {
      clearInterval(global.randomPromptTimer);
    }

    // Commenting out random prompt timer as in the original code
    /*
    global.randomPromptTimer = setInterval(() => {
      if (global.promptState.promptQueue.length < MAX_QUEUE_SIZE - 2) {
        addRandomPrompt();
      }
    }, RANDOM_PROMPT_INTERVAL);
    */

    return checkInterval;
  };

  initBackgroundTimer();
}
