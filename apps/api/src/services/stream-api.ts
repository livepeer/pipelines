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
          seed: Math.floor(Math.random() * 1000000000000000),
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
      // Additional workflow nodes would be added here...
    },
  };
}
