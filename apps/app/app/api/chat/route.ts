import { NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatResponse {
  content: string;
  suggestions: string[];
}

// Function to extract JSON from text response
function extractJsonFromText(text: string): ChatResponse | null {
  try {
    // Try direct parsing first
    return JSON.parse(text);
  } catch (error) {
    // If direct parsing fails, try to extract JSON from the text
    try {
      // Look for JSON-like structure with curly braces
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, create a default response
      return {
        content: "I've analyzed your request and created a prompt based on your input.",
        suggestions: ["Try adding more details", "Try specifying a style", "Try mentioning a specific artist"]
      };
    } catch (extractError) {
      console.error("Failed to extract JSON from text:", extractError);
      return null;
    }
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const image = formData.get("image") as File | null;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not set" },
        { status: 500 }
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

CRITICAL INSTRUCTION: Your response MUST be a valid JSON object with the following structure:
{
  "content": "A human-friendly description of what you've done",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

DO NOT include any text outside of this JSON structure. DO NOT start with "I'm sorry" or any other text. ONLY return the JSON object.`,
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
        messages: [
          systemMessage,
          { role: "user" as const, content: message },
        ],
        max_tokens: 1000,
      });
    }

    const content = completion.choices[0].message.content;
    
    // Extract JSON from the response
    const parsedContent = extractJsonFromText(content || "{}");
    
    if (!parsedContent) {
      console.error("Failed to parse OpenAI response:", content);
      return NextResponse.json(
        { error: "Failed to parse OpenAI response" },
        { status: 500 }
      );
    }
    
    // Validate the response structure
    if (!parsedContent.content || !Array.isArray(parsedContent.suggestions)) {
      console.error("Invalid response structure:", parsedContent);
      return NextResponse.json(
        { error: "Invalid response structure from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedContent);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
