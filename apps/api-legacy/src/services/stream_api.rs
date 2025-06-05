use anyhow::{Context, Result};
use base64::Engine;
use serde_json::json;
use tracing::{error, info};

pub async fn apply_prompt_to_stream(
    prompt_text: &str,
    stream_key: &str,
    gateway_host: &str,
    api_user: &str,
    api_password: &str,
) -> Result<()> {
    match apply_prompt_attempt(
        prompt_text,
        stream_key,
        gateway_host,
        api_user,
        api_password,
    )
    .await
    {
        Ok(_) => {
            info!("Successfully applied prompt to stream: {}", stream_key);
            Ok(())
        }
        Err(e) => {
            Err(anyhow::anyhow!("Failed to apply prompt: {}", e))
        }
    }
}

async fn apply_prompt_attempt(
    prompt_text: &str,
    stream_key: &str,
    gateway_host: &str,
    api_user: &str,
    api_password: &str,
) -> Result<()> {
    let (cleaned_prompt, quality, creativity) = parse_prompt_parameters(prompt_text);

    info!(
        "Applying prompt to stream {} with quality={}, creativity={}",
        stream_key, quality, creativity
    );

    let workflow = build_comfyui_workflow(&cleaned_prompt, quality, creativity);

    let client = reqwest::Client::new();
    let api_url = format!(
        "https://{}/live/video-to-video/{}/update",
        gateway_host, stream_key
    );

    let auth = format!("{}:{}", api_user, api_password);
    let auth_header = format!(
        "Basic {}",
        base64::engine::general_purpose::STANDARD.encode(&auth)
    );

    info!("Sending request to {}", api_url);
    let response = client
        .post(&api_url)
        .header("Authorization", auth_header)
        .header("Content-Type", "application/json")
        .json(&workflow)
        .send()
        .await
        .map_err(|e| {
            error!("Failed to send request: {:?}", e);
            e
        })
        .context("Failed to send request")?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Failed to read error response".to_string());
        return Err(anyhow::anyhow!(
            "Failed with status {}: {}",
            status,
            error_text
        ));
    }

    Ok(())
}

fn parse_prompt_parameters(prompt_text: &str) -> (String, f32, f32) {
    let mut cleaned_prompt = prompt_text.to_string();
    let mut quality = 3.0;
    let mut creativity = 0.6;

    if let Some(captures) = regex::Regex::new(r"--quality\s+(\d+(?:\.\d+)?)")
        .unwrap()
        .captures(prompt_text)
    {
        if let Some(quality_str) = captures.get(1) {
            if let Ok(parsed_quality) = quality_str.as_str().parse::<f32>() {
                quality = parsed_quality.clamp(1.0, 5.0);
                cleaned_prompt = cleaned_prompt.replace(captures.get(0).unwrap().as_str(), "");
            }
        }
    }

    if let Some(captures) = regex::Regex::new(r"--creativity\s+(\d+(?:\.\d+)?)")
        .unwrap()
        .captures(&cleaned_prompt)
    {
        if let Some(creativity_str) = captures.get(1) {
            if let Ok(parsed_creativity) = creativity_str.as_str().parse::<f32>() {
                creativity = parsed_creativity.clamp(0.1, 1.0);
                cleaned_prompt = cleaned_prompt.replace(captures.get(0).unwrap().as_str(), "");
            }
        }
    }

    (cleaned_prompt.trim().to_string(), quality, creativity)
}

fn build_comfyui_workflow(prompt_text: &str, quality: f32, creativity: f32) -> serde_json::Value {
    json!({
        "prompt": {
            "1": {
                "_meta": {
                    "title": "Load Image"
                },
                "inputs": {
                    "image": "example.png"
                },
                "class_type": "LoadImage"
            },
            "2": {
                "_meta": {
                    "title": "Depth Anything Tensorrt"
                },
                "inputs": {
                    "engine": "depth_anything_vitl14-fp16.engine",
                    "images": ["1", 0]
                },
                "class_type": "DepthAnythingTensorrt"
            },
            "3": {
                "_meta": {
                    "title": "TensorRT Loader"
                },
                "inputs": {
                    "unet_name": "static-dreamshaper8_SD15_$stat-b-1-h-512-w-512_00001_.engine",
                    "model_type": "SD15"
                },
                "class_type": "TensorRTLoader"
            },
            "5": {
                "_meta": {
                    "title": "CLIP Text Encode (Prompt)"
                },
                "inputs": {
                    "clip": ["23", 0],
                    "text": prompt_text
                },
                "class_type": "CLIPTextEncode"
            },
            "6": {
                "_meta": {
                    "title": "CLIP Text Encode (Prompt)"
                },
                "inputs": {
                    "clip": ["23", 0],
                    "text": ""
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "_meta": {
                    "title": "KSampler"
                },
                "inputs": {
                    "cfg": 1,
                    "seed": 785664736216738i64,
                    "model": ["24", 0],
                    "steps": quality as i32,
                    "denoise": 1,
                    "negative": ["9", 1],
                    "positive": ["9", 0],
                    "scheduler": "normal",
                    "latent_image": ["16", 0],
                    "sampler_name": "lcm"
                },
                "class_type": "KSampler"
            },
            "8": {
                "_meta": {
                    "title": "Load ControlNet Model"
                },
                "inputs": {
                    "control_net_name": "control_v11f1p_sd15_depth_fp16.safetensors"
                },
                "class_type": "ControlNetLoader"
            },
            "9": {
                "_meta": {
                    "title": "Apply ControlNet"
                },
                "inputs": {
                    "image": ["2", 0],
                    "negative": ["6", 0],
                    "positive": ["5", 0],
                    "strength": creativity,
                    "control_net": ["10", 0],
                    "end_percent": 1,
                    "start_percent": 0
                },
                "class_type": "ControlNetApplyAdvanced"
            },
            "10": {
                "_meta": {
                    "title": "TorchCompileLoadControlNet"
                },
                "inputs": {
                    "mode": "reduce-overhead",
                    "backend": "inductor",
                    "fullgraph": false,
                    "controlnet": ["8", 0]
                },
                "class_type": "TorchCompileLoadControlNet"
            },
            "11": {
                "_meta": {
                    "title": "Load VAE"
                },
                "inputs": {
                    "vae_name": "taesd"
                },
                "class_type": "VAELoader"
            },
            "13": {
                "_meta": {
                    "title": "TorchCompileLoadVAE"
                },
                "inputs": {
                    "vae": ["11", 0],
                    "mode": "reduce-overhead",
                    "backend": "inductor",
                    "fullgraph": true,
                    "compile_decoder": true,
                    "compile_encoder": true
                },
                "class_type": "TorchCompileLoadVAE"
            },
            "14": {
                "_meta": {
                    "title": "VAE Decode"
                },
                "inputs": {
                    "vae": ["13", 0],
                    "samples": ["7", 0]
                },
                "class_type": "VAEDecode"
            },
            "15": {
                "_meta": {
                    "title": "Preview Image"
                },
                "inputs": {
                    "images": ["14", 0]
                },
                "class_type": "PreviewImage"
            },
            "16": {
                "_meta": {
                    "title": "Empty Latent Image"
                },
                "inputs": {
                    "width": 512,
                    "height": 512,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "23": {
                "_meta": {
                    "title": "Load CLIP"
                },
                "inputs": {
                    "type": "stable_diffusion",
                    "device": "default",
                    "clip_name": "CLIPText/model.fp16.safetensors"
                },
                "class_type": "CLIPLoader"
            },
            "24": {
                "_meta": {
                    "title": "Feature Bank Attention Processor"
                },
                "inputs": {
                    "model": ["3", 0],
                    "use_feature_injection": false,
                    "feature_cache_interval": 4,
                    "feature_bank_max_frames": 4,
                    "feature_injection_strength": 0.8,
                    "feature_similarity_threshold": 0.98
                },
                "class_type": "FeatureBankAttentionProcessor"
            }
        }
    })
}
