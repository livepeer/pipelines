import { NextResponse } from "next/server";
import OpenAI from "openai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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
    const messagesJson = formData.get("messages") as string;
    const messageHistory = (
      messagesJson ? JSON.parse(messagesJson) : []
    ) as Message[];

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

    // Extract the current prompt from the last assistant message
    let currentPrompt = "";
    for (let i = messageHistory.length - 1; i >= 0; i--) {
      if (messageHistory[i].role === "assistant") {
        const match = messageHistory[i].content.match(
          /Current prompt: "(.*?)"/,
        );
        if (match) {
          currentPrompt = match[1];
          break;
        }
      }
    }

    const systemMessage = {
      role: "system" as const,
      content: `You are an expert at helping users refine their video filter prompts through iterative feedback. 

Your task is to maintain and improve a single prompt based on user feedback. Each response should:

1. ALWAYS start with "Current prompt: " followed by the complete, updated prompt in quotes
2. Then provide a brief explanation of what changed
3. Offer 3-4 short, specific visual suggestions for further refinement

Key rules:
- Build upon the existing prompt instead of creating new ones
- Keep suggestions focused on visual changes (e.g. "Add fog", "More dramatic", "Golden sunset")
- Make each suggestion 1-3 words only
- If starting fresh, create a base prompt that captures the core visual concept
- Always maintain context from previous messages
- Consider the entire conversation history when refining the prompt
- If the user provides specific feedback about previous suggestions, incorporate that feedback into the new prompt

Current prompt to build upon: "${currentPrompt}"`,
    };

    // Use standard model for text-only prompts
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        systemMessage,
        ...messageHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user" as const, content: message },
      ],
      max_tokens: 1000,
    });

    // Extract the response content
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Parse the response using our helper function
    const parsedResponse = extractJsonFromText(responseText);
    if (!parsedResponse) {
      // If parsing fails completely, return a basic response with the raw text
      return NextResponse.json({
        content: responseText,
        suggestions: [],
      });
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
