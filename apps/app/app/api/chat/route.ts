import { NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatResponse {
  content: string;
  suggestions: string[];
}

export async function POST(req: Request) {
  try {
    const { message, image } = await req.json();

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a prompt engineering assistant that helps users create optimized prompts for image generation.
Your task is to:
1. Analyze the user's input and any reference image
2. Create a technically optimized prompt that will produce high-quality results
3. Generate 2-3 natural language suggestions for variations
4. Provide a human-friendly description of what will be created

Format your response as JSON with the following structure:
{
  "content": "Human friendly description of what will be created",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}`
        },
        {
          role: "user",
          content: `User input: ${message}\n${image ? 'Reference image provided: Yes' : 'No reference image provided'}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
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
