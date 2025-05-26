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
    const kb = await loadKnowledgeBase();
    const trimmed = (message ?? "").trim();
    const isRandom = !trimmed || trimmed.length > 150;

    const intro = `Study this first ${kb}, then`;
    const body = isRandom
      ? `create a detailed character prompt influenced by: ${keywords.join(", ")}.`
      : `create a detailed prompt based on this user description: "${trimmed}". Focus on the character or scene described.`;

    const userPrompt = `${intro} ${body}`;

    const { choices } = await groq.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      top_p: 0.95,
      max_completion_tokens: 1024,
      reasoning_format: "hidden", // set to raw to show model thought process
      messages: [{ role: "user", content: userPrompt }],
    });

    return processResponse(choices[0]?.message?.content ?? "");
  } catch (err) {
    console.error("Error generating prompt:", err);
    throw new Error("Failed to generate prompt");
  }
};

export const chatWithAI = async ({ messages, style, keywords }: ChatParams) => {
  try {
    const kb = await loadKnowledgeBase();
    const userInstructions = `
Study this first ${kb}, then create or edit detailed character prompts.
Current style: ${style}, the style should strongly influence the prompt.
The following keywords should be used in the prompt if provided: ${
      keywords.join(", ") || "none"
    } 

IMPORTANT FORMATTING INSTRUCTION:
Include a section titled "What's New". For example:

What's New:
1. First change
2. Second change

After the What's New section, add a section titled "Would you like to improve the prompt further?" 
IMPORTANT: This section MUST contain EXACTLY 3 suggestions in this format:

Would you like to improve the prompt further?
1. First suggestion
2. Second suggestion 
3. Third suggestion



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
      reasoning_format: "hidden", // set to raw to show model thought process
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

export const cleanPromptParameters = (promptText: string) => {
  return promptText
    .replace(/\s*--quality\s+\d+(\.\d+)?/g, "")
    .replace(/\s*--creativity\s+\d+(\.\d+)?/g, "")
    .replace(/\s*--denoise\s+\d+(\.\d+)?/g, "")
    .trim();
};

export const cleanDenoiseParam = (promptText: string) => {
  return promptText.replace(/\s*--denoise\s+\d+(\.\d+)?/g, "").trim();
};

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
      "--creativity 0.3 ",
    );
  }

  if (!processed.includes("--denoise")) {
    processed += " --denoise 0.5";
  } else if (!processed.match(/--denoise\s+\d+(\.\d+)?/)) {
    processed = processed.replace(/--denoise(\s+)?($|\s)/, "--denoise 0.1 ");
  }

  processed = processed.replace(/,/g, "").replace(/\s+/g, " ").trim();

  return processed.replace(/^["'\s]+|["'\s]+$/g, "");
};

export function extractSuggestions(response: string): {
  content: string;
  suggestions: string[];
} {
  const sectionRegex =
    /Would you like to improve the prompt further\?[\s\S]*?(\d+\..*?)(?=\n\n|$)/gis;
  const sectionMatch = response.match(sectionRegex);
  let suggestions: string[] = [];
  let content = response;

  if (sectionMatch) {
    const rawSection = sectionMatch[0];
    const suggestionItems = rawSection.matchAll(/(\d+)\.\s*(.+?)(?=\s*\d+\.\s*[A-Z]|$)/gs);
    suggestions = Array.from(suggestionItems, m => m[2].trim());
    suggestions = suggestions.filter(
      (suggestion, index, arr) =>
        arr.findIndex(s => s.toLowerCase() === suggestion.toLowerCase()) ===
        index,
    );
    content = response.replace(
      rawSection,
      "Would you like to improve the prompt further?",
    );
  }

  // Split content and add character limit
  const whatsNewMatch = content.match(/(.*?)\s*What's New:\s*([\s\S]*)/i);

  if (whatsNewMatch) {
    let mainPrompt = whatsNewMatch[1].trim();

    // Keep prompts under 300 characters
    if (mainPrompt.length > 270) {
      mainPrompt = mainPrompt.substring(0, 270).trim() + "...";
    }

    const processedMainPrompt = processResponse(mainPrompt);
    let formattedWhatsNew = whatsNewMatch[2];
    formattedWhatsNew = formattedWhatsNew.replace(
      /(\d+)\.\s+([A-Z])/g,
      "\n$1. $2",
    );
    formattedWhatsNew = formattedWhatsNew.replace(/^\n/, "").trim();

    // trim duplicate would you like to improve.. text
    formattedWhatsNew = formattedWhatsNew
      .replace(/Would you like to improve the prompt further\?/gi, "")
      .trim();

    const finalContent = `${processedMainPrompt}\n\nWhat's New:\n${formattedWhatsNew}\n\nWould you like to improve the prompt further?`;

    return { content: finalContent, suggestions };
  } else {
    // cases without "What's New" section
    let truncatedContent = processResponse(content);
    if (truncatedContent.length > 270) {
      truncatedContent = truncatedContent.substring(0, 270).trim() + "...";
    }
    return { content: truncatedContent, suggestions };
  }
}