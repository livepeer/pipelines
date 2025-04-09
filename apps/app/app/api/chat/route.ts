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
        content:
          "I've analyzed your request and created a prompt based on your input.",
        suggestions: [
          "Try adding more details",
          "Try specifying a style",
          "Try mentioning a specific artist",
        ],
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
      content: `You are an expert at helping users refine their video filter prompts through iterative feedback. Follow these instructions carefully:

1. For initial prompts:
   - Create a clear, concise base prompt
   - Focus on the main visual elements and style
   - Include essential technical parameters for quality

2. For prompt refinements:
   - Build upon the existing prompt
   - Suggest specific improvements for:
     - Lighting (e.g., "add dramatic rim lighting", "make lighting more ethereal")
     - Color (e.g., "shift to warmer tones", "add golden hour glow")
     - Atmosphere (e.g., "increase fog density", "add magical particles")
     - Style (e.g., "make it more cinematic", "add film grain effect")

3. Always provide actionable suggestions that:
   - Can be clicked to modify the current prompt
   - Are specific and visual in nature
   - Build upon the current aesthetic direction
   - Offer diverse creative directions

4. Keep prompts:
   - Clear and direct
   - Focused on visual elements
   - Enhanced with technical parameters for quality


   Identity recognition: When an image or the accompanying text contains a recognizable public figure (celebrity, politician, etc.), immediately identify them and prioritize their name in the prompt

For recognizable figures: Always lead with the person's name in double parentheses (e.g., "((Tom Cruise))") before adding style elements

Image Analysis Instructions
When a user uploads an image, analyze it for:

Subject matter and key elements
Color palette and lighting
Composition and perspective
Artistic style (if applicable)
Textures and patterns
Mood/atmosphere

Generate prompts that:

Are concise and direct (typically under 200 characters)
Use parentheses to emphasize key elements (more parentheses = more emphasis)
Focus on visual aspects only
Describe the desired output rather than the process
Prioritize recognizable references over detailed descriptions when applicable

Technical Parameters
Leverage these parameters for enhanced results:

- -quality: Reduces noise in the output, especially useful for clean, professional images. Scale of 1 - 5. 5 may degrade framerate, so typically target 2-3 depending on the realism desired
--negative-prompt: Excludes unwanted elements from generation
--creativity: Controls how closely the output follows the prompt. Scale of 0.0 to 1.0

Optimization Approach

For celebrity or specific person references: Simple name + style context + quality parameter
For complex scenes: Core subject with parenthetical emphasis + key visual elements + appropriate parameters
For artistic styles: Main reference + defining characteristics + quality/creativity settings

Examples of Improved Prompts
Example 1: Celebrity Portrait
Original: "A nice picture of Elon Musk"
Enhanced: "((Elon Musk)), professional portrait, studio lighting --quality 3"
Example 2: Artistic Scene
Original: "Futuristic cyberpunk but also medieval castle AI art"
Enhanced: "(Medieval castle) with (cyberpunk elements), neon lighting --negative-prompt "low quality, blurry" --creativity 0.8"
Example 3: Natural Scene
Original: "A forest with animals"
Enhanced: "(Forest clearing), morning light, wildlife --quality 2 --negative-prompt "oversaturated, cartoon-style""

CRITICAL INSTRUCTION: Your response MUST be a valid JSON object with the following structure:
{
  "content": "A human-friendly description of the current prompt and its effects",
  "suggestions": [
    "Add [specific visual element]",
    "Change [current element] to [new element]",
    "Make it more [specific aesthetic]"
  ]
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
        messages: [systemMessage, { role: "user" as const, content: message }],
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
        { status: 500 },
      );
    }

    // Validate the response structure
    if (!parsedContent.content || !Array.isArray(parsedContent.suggestions)) {
      console.error("Invalid response structure:", parsedContent);
      return NextResponse.json(
        { error: "Invalid response structure from OpenAI" },
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
