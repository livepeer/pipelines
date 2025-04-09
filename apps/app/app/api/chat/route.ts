import { NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatResponse {
  content: string;
  suggestions: string[];
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const image = formData.get("image") as File | null;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not set" },
        { status: 500 },
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    let imageBase64: string | undefined;
    let imageType: string | undefined;

    if (image) {
      const buffer = await image.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
      imageType = image.type;
    }

    const systemMessage = {
      role: "system" as const,
      content: `You are an expert at crafting optimized prompts for image generation. Follow these instructions carefully:

1. For recognizable figures (celebrities, public figures):
   - Use their name as the first word
   - Add "(celebrity)" after their name
   - Example: "Brad Pitt (celebrity), portrait, professional lighting"

2. For image analysis:
   - Identify subject matter, color palette, lighting, composition, style
   - Create a concise prompt that captures the essence
   - Include technical parameters for enhanced results

3. For text prompts:
   - Keep them simple and direct
   - Use parentheses for emphasis: "(masterpiece), (best quality), (highly detailed)"
   - Add technical parameters: "8k uhd, high quality, masterpiece, best quality, highly detailed"

4. Always prioritize recognizable references over detailed descriptions.

5. Follow this optimization approach:
   - For celebrity/character prompts: Start with name + "(celebrity)" or character name
   - For style-based prompts: Start with style description
   - For concept-based prompts: Start with the main concept
   - Add technical parameters at the end

Your response must be a valid JSON object with the following structure:
{
  "content": "A human-friendly description of what you've done",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`,
    };

    let completion;

    if (imageBase64) {
      // Use vision model for image analysis
      completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          systemMessage,
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: message },
              {
                type: "image_url" as const,
                image_url: {
                  url: `data:${imageType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });
    } else {
      // Use standard model for text-only prompts
      completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [systemMessage, { role: "user" as const, content: message }],
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });
    }

    const content = completion.choices[0].message.content;

    // Parse the response as JSON
    let parsedContent: ChatResponse;
    try {
      parsedContent = JSON.parse(content || "{}");
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return NextResponse.json(
        { error: "Failed to parse OpenAI response" },
        { status: 500 },
      );
    }

    return NextResponse.json(parsedContent);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    );
  }
}
