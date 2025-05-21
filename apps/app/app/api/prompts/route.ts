import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";
import {
  isPromptNSFW as isPromptNSFW,
  getRandomSafePrompt,
} from "@/lib/nsfwCheck";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, id } = body;

    if (!content) {
      return NextResponse.json({ error: "Missing 'content'" }, { status: 400 });
    }

    // Check if the prompt is attempting to generate NSFW content
    let finalPrompt = content;
    // let wasCensored = false;
    // let censorExplanation = "";

    // const nsfwCheck = await isPromptNSFW(content);

    // if (nsfwCheck.isNSFW) {
    //   // Replace with a safe prompt
    //   finalPrompt = getRandomSafePrompt();
    //   wasCensored = true;
    //   censorExplanation = nsfwCheck.explanation;
    //   console.log(`Censored prompt: "${content}" - ${censorExplanation}`);
    // }

    const newId = id ? id : uuidv4();
    const createdAt = Date.now().toString();

    const prompt = {
      id: newId,
      content: finalPrompt,
      created_at: createdAt,
    };

    await redis.lpush("prompt:stream", JSON.stringify(prompt));
    await redis.ltrim("prompt:stream", 0, 99); // keep latest 100

    console.log("Prompt added to stream:", prompt);

    return NextResponse.json({
      prompt,
      wasCensored: false,
      censorExplanation: "",
    });
  } catch (error) {
    console.error("Error adding to prompt queue:", error);
    return NextResponse.json(
      { error: "Failed to add to prompt queue" },
      { status: 500 },
    );
  }
}
