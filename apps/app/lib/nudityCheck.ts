import { OpenAI } from "openai";

// Array of fun, safe alternative prompts
export const safePrompts = [
  "Cute teletubbies dancing in a field of flowers --quality 3",
  "Adorable kittens playing with yarn --creativity 0.8",
  "Baby chicks hatching from colorful eggs --quality 3",
  "Friendly panda bears eating bamboo --creativity 0.7",
  "Magical unicorns in an enchanted forest --quality 3",
  "Cartoon robots having a tea party --creativity 0.9",
  "Happy sunflowers turning toward the sun --quality 3",
  "Friendly dolphins jumping through ocean waves --creativity 0.8",
  "Colorful hot air balloons floating over mountains --quality 3",
  "Smiling turtles swimming in a crystal clear pond --creativity 0.7",
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
