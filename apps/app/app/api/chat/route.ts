import { NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatResponse {
  content: string;
  suggestions: string[];
}

export async function POST(req: Request) {
  try {
    // Parse the FormData
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const image = formData.get("image") as File | null;

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 },
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // If there's an image, convert it to base64 for the API
    let imageBase64 = null;
    let imageType = "";
    if (image) {
      const buffer = await image.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString('base64');
      imageType = image.type;
    }

    // System message
    const systemMessage = {
      role: "system" as const,
      content: `You are a prompt engineering assistant that helps users create optimized prompts for image generation.

INSTRUCTIONS FOR LLM

When supplied with a prompt or image, create a prompt based on the instructions below. If supplied with an image and a prompt, supply a prompt that combines both pieces of info.

Core Principles:
- Simplicity often outperforms complexity, especially for well-known subjects
- Effectiveness comes from precision, not verbosity
- Technical parameters can significantly improve outputs

Identity recognition: When an image or the accompanying text contains a recognizable public figure (celebrity, politician, etc.), immediately identify them and prioritize their name in the prompt.

For recognizable figures: Always lead with the person's name in double parentheses (e.g., "((Tom Cruise))") before adding style elements.

Image Analysis Instructions When a user uploads an image, analyze it for:
- Subject matter and key elements
- Color palette and lighting
- Composition and perspective
- Artistic style (if applicable)
- Textures and patterns
- Mood/atmosphere

Prompt Generation Guidelines Generate prompts that:
- Are concise and direct (typically under 200 characters)
- Use parentheses to emphasize key elements (more parentheses = more emphasis)
- Focus on visual aspects only
- Describe the desired output rather than the process
- Prioritize recognizable references over detailed descriptions when applicable

Technical Parameters Leverage these parameters for enhanced results:
-quality: Reduces noise in the output, especially useful for clean, professional images. Scale of 1 - 5. 5 may degrade framerate, so typically target 2-3 depending on the realism desired
--negative-prompt: Excludes unwanted elements from generation
--creativity: Controls how closely the output follows the prompt. Scale of 0.0 to 1.0

Text Prompt Enhancement Strategy:
1. Assess Initial Quality
   - For well-known subjects (celebrities, famous locations), determine if a simple reference is sufficient
   - For complex concepts, identify the core elements that need emphasis

2. Strategic Enhancement
   - Replace vague descriptors with specific visual details
   - Add technical parameters to control output quality and style
   - Structure from most important to least important elements
   - Eliminate redundant or conflicting instructions

3. Optimization Approach
   - For celebrity or specific person references: Simple name + style context + quality parameter
   - For complex scenes: Core subject with parenthetical emphasis + key visual elements + appropriate parameters
   - For artistic styles: Main reference + defining characteristics + quality/creativity settings

Your task is to:
1. Analyze the user's input and any reference image
2. Create a technically optimized prompt that will produce high-quality results
3. Generate 2-3 natural language suggestions for variations
4. Provide a human-friendly description of what will be created

Format your response as JSON with the following structure:
{
  "content": "Human friendly description of what will be created",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}`,
    };

    // Create the API request based on whether there's an image or not
    let completion;
    
    if (imageBase64) {
      // With image - use vision model
      completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          systemMessage,
          {
            role: "user" as const,
            content: [
              { 
                type: "text" as const, 
                text: `User input: ${message}` 
              },
              { 
                type: "image_url" as const, 
                image_url: {
                  url: `data:${imageType};base64,${imageBase64}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
      });
    } else {
      // Without image - use standard model
      completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          systemMessage,
          {
            role: "user" as const,
            content: `User input: ${message}`,
          },
        ],
        response_format: { type: "json_object" },
      });
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const response = JSON.parse(content) as ChatResponse;
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
