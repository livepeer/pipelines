import { NextResponse } from 'next/server';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { message, image } = await req.json();

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Generate optimized prompt
    const { text: optimizedPrompt } = await generateText({
      model: 'gpt-4',
      apiKey: openaiApiKey,
      system: `You are a prompt engineering assistant that helps users create optimized prompts for image generation.
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
      prompt: `User input: ${message}
${image ? 'Reference image provided: Yes' : 'No reference image provided'}`,
    });

    // TODO: Submit the optimized prompt to the external API
    // For now, we'll just return a mock response
    const mockResponse = {
      content: "I'll create a beautiful visualization based on your description. The image will feature vibrant colors and detailed elements that match your request.",
      suggestions: [
        "Make it more detailed",
        "Add more dramatic lighting",
        "Include additional elements"
      ]
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 