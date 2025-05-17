import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

type PromptParams = {
  keywords: string[];
  message: string;
};

type ChatParams = {
  messages: { role: "user" | "assistant"; content: string }[];
  style: string;
  keywords: string[];
};

export const generateAIPrompt = async ({ keywords, message }: PromptParams) => {
  try {
    const knowledgeBase = await loadKnowledgeBase();

    const userPrompt = `Study the knowledge base first ${knowledgeBase}, then generate a detailed character prompt.
If the ${message} starts like a request e.g. "I want...", "Create a...", "Generate a...", "Make a...", "Design a...", "Draw a...", or "Illustrate a...", create the prompt around the user's request ignoring the keywords.
Otherwise using these keywords, create a detailed character prompt: ${keywords.join(
      ", ",
    )}.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: userPrompt }],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      max_completion_tokens: 1024,
      top_p: 0.95,
      reasoning_format: "hidden",
    });

    const response = chatCompletion.choices[0]?.message?.content || "";

    return processResponse(response);
  } catch (error) {
    console.error("Error generating prompt:", error);
    throw new Error("Failed to generate prompt");
  }
};

export const chatWithAI = async ({ messages, style, keywords }: ChatParams) => {
  try {
    const knowledgeBase = await loadKnowledgeBase();
    const userInstructions = `
Study the knowledge base first ${knowledgeBase}, then help generate or edit detailed character prompts.
Current style: ${style} Maintain this aesthetic style in the prompts
The following keywords should influence the prompt edit or creation if provided: ${
      keywords.join(", ") || "none"
    } 

IMPORTANT FORMATTING INSTRUCTION:
At the end of your response, include a section titled "Key Improvements and Changes". For example:

Key Improvements and Changes:
1. Created a Knowledge Base File:
   - Moved all the system instructions, prompt creation guidelines
2. Modular Code Structure:
   - Handles loading, caching, importing, and exporting the knowledge base

After this section, end with a relevant question to the user about potential further improvements or suggest improvements you feel would improve the prompt.

Here's our conversation so far:
`;
    const conversationHistory = messages
      .map(
        msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      )
      .join("\n\n");
    const groqMessages = [
      {
        role: "user" as const,
        content: userInstructions + conversationHistory,
      },
    ];
    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      max_completion_tokens: 1024,
      top_p: 0.95,
      reasoning_format: "hidden",
    });
    const response = chatCompletion.choices[0]?.message?.content || "";
    return processResponse(response);
  } catch (error) {
    console.error("Error in chat:", error);
    throw new Error("Failed to chat with AI");
  }
};

export async function loadKnowledgeBase(): Promise<string> {
  const knowledgeBaseCache: string | null = null;

  if (knowledgeBaseCache) {
    return knowledgeBaseCache;
  }

  try {
    const response = await fetch("/knowledge-base.txt");
    return await response.text();
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    throw new Error("Failed to load knowledge base");
  }
}

const processResponse = (response: string): string => {
  let processed = response
    .replace(
      /^(here('s| is)( a)? .*?prompt.*?:|generating.*?:|prompt:|\*\*prompt:\*\*|.*?prompt for you:)/i,
      "",
    )
    .replace(/^\s*\*\*.*?\*\*\s*/, "")
    .replace(/^\s*\(|\)\s*$/, "")
    .trim();

  if (!processed.match(/--quality\s+\d+(\.\d+)?/)) {
    processed = processed.replace(/--quality(\s+)?($|\s)/, "--quality 4 ");
  }

  if (!processed.match(/--creativity\s+\d+(\.\d+)?/)) {
    processed = processed.replace(
      /--creativity(\s+)?($|\s)/,
      "--creativity 0.7 ",
    );
  }

  if (!processed.includes("--denoise")) {
    processed += " --denoise 0.5";
  } else if (!processed.match(/--denoise\s+\d+(\.\d+)?/)) {
    processed = processed.replace(/--denoise(\s+)?($|\s)/, "--denoise 0.2 ");
  }

  return processed
    .replace(/\n/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
};

export const cleanPromptParameters = (promptText: string) => {
  return promptText
    .replace(/\s*--quality\s+\d+(\.\d+)?/g, "")
    .replace(/\s*--creativity\s+\d+(\.\d+)?/g, "")
    .replace(/\s*--denoise\s+\d+(\.\d+)?/g, "")
    .trim();
};

export const extractParametersFromPrompt = (promptText: string) => {
  const parameters: {
    quality: number | null;
    creativity: number | null;
    denoise: number | null;
  } = {
    quality: 0,
    creativity: 0,
    denoise: 0,
  };

  const qualityRegex = /--quality\s+(\d+(\.\d+)?)/i;
  const creativityRegex = /--creativity\s+(\d+(\.\d+)?)/i;
  const denoiseRegex = /--denoise\s+(\d+(\.\d+)?)/i;

  const qualityMatch = promptText.match(qualityRegex);
  const creativityMatch = promptText.match(creativityRegex);
  const denoiseMatch = promptText.match(denoiseRegex);

  if (qualityMatch && qualityMatch[1]) {
    parameters.quality = parseFloat(qualityMatch[1]);
  }

  if (creativityMatch && creativityMatch[1]) {
    parameters.creativity = parseFloat(creativityMatch[1]);
  }

  if (denoiseMatch && denoiseMatch[1]) {
    parameters.denoise = parseFloat(denoiseMatch[1]);
  }

  return parameters;
};

export function trimMessage(raw: string): string {
  let result = raw
    .replace(
      /Key Improvements and Changes:/g,
      "\n\nKey Improvements and Changes:",
    )
    .replace(/,\s*(\d+\.)/g, "\n$1")
    .replace(/,\s*\*/g, "*")
    .replace(/(\d+\.)\s+([A-Z])/g, "$1 $2")
    .replace(
      /(\*\s*\d+\.\s*\*\s*\*\*.*?\*\.?)\s*(Would|Do|Should|What|How|Could)/g,
      "$1\n$2",
    );

  if (
    !result.includes("\n\nWould") &&
    !result.includes("\n\nDo") &&
    !result.includes("\n\nShould") &&
    !result.includes("\n\nWhat") &&
    !result.includes("\n\nHow") &&
    !result.includes("\n\nCould")
  ) {
    result = result.replace(
      /([^.!?\n])((?:Would|Do|Should|What|How|Could)\s+you)/g,
      "$1\n\n$2",
    );
  }

  return result;
}
