import { OpenAI } from "openai";

// Array of fun, safe alternative prompts
export const safePrompts = [
  "Cute teletubbie --quality 3 --creativity 0.6",
  "Adorable kitten --quality 3 --creativity 0.6",
  "Baby chick hatching from a colorful egg --quality 3 --creativity 0.6",
  "Friendly panda bear eating bamboo --quality 3 --creativity 0.6",
  "Magical unicorns --quality 3 --creativity 0.6",
  "Cartoon robot --quality 3 --creativity 0.6",
  "Happy sunflower turning toward the sun --quality 3 --creativity 0.6",
];

// Get a random safe prompt
export function getRandomSafePrompt(): string {
  const randomIndex = Math.floor(Math.random() * safePrompts.length);
  return safePrompts[randomIndex];
}

// OpenAI client initialization
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * Checks if a prompt is attempting to generate nudity or NSFW content
 * @param prompt The user's prompt to check
 * @returns Object containing result and explanation
 */
export async function checkPromptForNudity(prompt: string): Promise<{
  containsNudity: boolean;
  explanation: string;
}> {
  try {
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a content moderation assistant. Your task is to determine if a StableDiffusion image generation prompt is trying to generate nudity, explicit content, or NSFW imagery. Respond with either 'true' if the prompt is attempting to generate such content, or 'false' if it appears safe. Then provide a brief explanation of your decision.",
        },
        {
          role: "user",
          content: `Analyze this StableDiffusion prompt to determine if it's attempting to generate nudity or NSFW content: "${prompt}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
    });

    const responseText = response.choices[0]?.message?.content || "";

    // Check if the response contains "true"
    const containsNudity = responseText.toLowerCase().includes("true");

    // Extract explanation - everything after "true" or "false"
    const explanation = responseText
      .replace(/^(true|false)/i, "")
      .replace(/^[,.:;-\s]+/, "")
      .trim();

    return {
      containsNudity,
      explanation,
    };
  } catch (error) {
    console.error("Error checking prompt for nudity:", error);
    // Default to allowing the prompt if there's an API error
    return {
      containsNudity: false,
      explanation: "Error checking content, allowing by default",
    };
  }
}
