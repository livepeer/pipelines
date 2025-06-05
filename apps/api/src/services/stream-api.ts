interface PromptParameters {
  cleanedPrompt: string;
  quality: number;
  creativity: number;
}

export async function applyPromptToStream(
  promptText: string,
  streamKey: string,
  gatewayHost: string,
  apiUser: string,
  apiPassword: string,
): Promise<void> {
  try {
    await applyPromptAttempt(
      promptText,
      streamKey,
      gatewayHost,
      apiUser,
      apiPassword,
    );
    console.log(`Successfully applied prompt to stream: ${streamKey}`);
  } catch (error) {
    throw new Error(`Failed to apply prompt: ${error}`);
  }
}

async function applyPromptAttempt(
  promptText: string,
  streamKey: string,
  gatewayHost: string,
  apiUser: string,
  apiPassword: string,
): Promise<void> {
  const { cleanedPrompt, quality, creativity } =
    parsePromptParameters(promptText);

  console.log(
    `Applying prompt to stream ${streamKey} with quality=${quality}, creativity=${creativity}`,
  );

  const workflow = buildComfyUIWorkflow(cleanedPrompt, quality, creativity);

  const apiUrl = `https://${gatewayHost}/live/video-to-video/${streamKey}/update`;
  const auth = Buffer.from(`${apiUser}:${apiPassword}`).toString("base64");

  console.log(`Sending request to ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workflow),
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to read error response");
    throw new Error(`Failed with status ${response.status}: ${errorText}`);
  }
}

function parsePromptParameters(promptText: string): PromptParameters {
  let cleanedPrompt = promptText;
  let quality = 3.0;
  let creativity = 0.6;

  // Parse --quality parameter
  const qualityMatch = cleanedPrompt.match(/--quality\s+(\d+(?:\.\d+)?)/);
  if (qualityMatch) {
    const parsedQuality = parseFloat(qualityMatch[1]);
    quality = Math.max(1.0, Math.min(5.0, parsedQuality));
    cleanedPrompt = cleanedPrompt.replace(qualityMatch[0], "");
  }

  // Parse --creativity parameter
  const creativityMatch = cleanedPrompt.match(/--creativity\s+(\d+(?:\.\d+)?)/);
  if (creativityMatch) {
    const parsedCreativity = parseFloat(creativityMatch[1]);
    creativity = Math.max(0.1, Math.min(1.0, parsedCreativity));
    cleanedPrompt = cleanedPrompt.replace(creativityMatch[0], "");
  }

  return {
    cleanedPrompt: cleanedPrompt.trim(),
    quality,
    creativity,
  };
}
function buildComfyUIWorkflow(
  promptText: string,
  quality: number,
  creativity: number,
): any {
  return {
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
          steps: Math.floor(quality),
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
}
