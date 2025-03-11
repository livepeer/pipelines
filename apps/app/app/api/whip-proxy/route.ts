import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from "@/lib/serverEnv";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let targetWhipEndpoint = url.searchParams.get('url');
  
  if (!targetWhipEndpoint) {
    return new NextResponse('Target WHIP endpoint not specified', { status: 400 });
  }

  targetWhipEndpoint = targetWhipEndpoint.trim();
  if (targetWhipEndpoint.includes('?')) {
    targetWhipEndpoint = targetWhipEndpoint.split('?')[0];
  }
  if (targetWhipEndpoint.endsWith('/')) {
    targetWhipEndpoint = targetWhipEndpoint.slice(0, -1);
  }

  console.log('WHIP proxy request to:', targetWhipEndpoint);
  
  try {
    const { gateway } = await serverConfig();
    const username = gateway.userId;
    const password = gateway.password;
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");

    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    }
    
    headers.set('Authorization', `Basic ${credentials}`);
    
    const response = await fetch(targetWhipEndpoint, {
      method: 'POST',
      headers,
      body: req.body,
      duplex: 'half'
    } as any);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`WHIP proxy error response (${response.status}):`, errorText);
      return new NextResponse(errorText, { 
        status: response.status,
        headers: response.headers 
      });
    }

    const responseHeaders = new Headers(response.headers);
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('WHIP proxy error:', error);
    return new NextResponse(`WHIP proxy error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  const url = new URL(req.url);
  let targetWhipEndpoint = url.searchParams.get('url');
  
  if (!targetWhipEndpoint) {
    return new NextResponse('Target WHIP endpoint not specified', { status: 400 });
  }

  targetWhipEndpoint = targetWhipEndpoint.trim();
  if (targetWhipEndpoint.includes('?')) {
    targetWhipEndpoint = targetWhipEndpoint.split('?')[0];
  }
  if (targetWhipEndpoint.endsWith('/')) {
    targetWhipEndpoint = targetWhipEndpoint.slice(0, -1);
  }
  
  try {
    const { gateway } = await serverConfig();
    const username = gateway.userId;
    const password = gateway.password;
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");

    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    }
    headers.set('Authorization', `Basic ${credentials}`);

    const response = await fetch(targetWhipEndpoint, {
      method: 'OPTIONS',
      headers,
    } as any);

    return new NextResponse(null, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('WHIP proxy OPTIONS error:', error);
    return new NextResponse(`WHIP proxy error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}

export async function HEAD(req: NextRequest) {
  const url = new URL(req.url);
  let targetWhipEndpoint = url.searchParams.get('url');
  
  if (!targetWhipEndpoint) {
    return new NextResponse('Target WHIP endpoint not specified', { status: 400 });
  }

  targetWhipEndpoint = targetWhipEndpoint.trim();
  if (targetWhipEndpoint.includes('?')) {
    targetWhipEndpoint = targetWhipEndpoint.split('?')[0];
  }
  if (targetWhipEndpoint.endsWith('/')) {
    targetWhipEndpoint = targetWhipEndpoint.slice(0, -1);
  }
  
  console.log('WHIP proxy HEAD request to:', targetWhipEndpoint);
  
  try {
    const { gateway } = await serverConfig();
    const username = gateway.userId;
    const password = gateway.password;
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");

    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    }
    headers.set('Authorization', `Basic ${credentials}`);
    
    const response = await fetch(targetWhipEndpoint, {
      method: 'HEAD',
      headers,
    } as any);

    console.log('WHIP proxy HEAD response status:', response.status);
    
    return new NextResponse(null, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('WHIP proxy HEAD error:', error);
    return new NextResponse(`WHIP proxy error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
} 