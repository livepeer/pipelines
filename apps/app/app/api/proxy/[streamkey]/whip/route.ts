import { NextRequest, NextResponse } from "next/server";
import { getGatewayConfig, serverConfig } from "@/lib/serverEnv";

export const dynamic = "force-dynamic";

// Whip proxy
async function handleRequest(
  req: NextRequest,
  method: string,
  streamkey: string,
) {
  try {
    const gateway = getGatewayConfig(req.nextUrl.searchParams);
    const targetWhipEndpoint = `${gateway.url}/${streamkey}/whip`;
    const credentials = Buffer.from(
      `${gateway.userId}:${gateway.password}`,
    ).toString("base64");

    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.set("Authorization", `Basic ${credentials}`);

    const response = await fetch(targetWhipEndpoint, {
      method,
      headers,
      body: method === "POST" ? req.body : undefined,
      duplex: method === "POST" ? "half" : undefined,
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `WHIP proxy error response (${response.status}):`,
        errorText,
      );
      return new NextResponse(errorText, {
        status: response.status,
        headers: response.headers,
      });
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error(`WHIP proxy ${method} error:`, error);
    return new NextResponse(
      `WHIP proxy error: ${error instanceof Error ? error.message : String(error)}`,
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { streamkey: string } },
) {
  return handleRequest(req, "POST", params.streamkey);
}

export async function OPTIONS(
  req: NextRequest,
  { params }: { params: { streamkey: string } },
) {
  return handleRequest(req, "OPTIONS", params.streamkey);
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: { streamkey: string } },
) {
  return handleRequest(req, "HEAD", params.streamkey);
}
