import { NextResponse } from "next/server";

export async function GET() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    ?? "unknown";

  return NextResponse.json({ version: commitSha });
}
