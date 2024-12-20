import type { NextRequest } from 'next/server';
import { NextResponse } from "next/server";
import {getStream} from "@/app/api/streams/get";
import {serverConfig} from "@/lib/serverEnv";

const ERROR_MESSAGES = {
    UNAUTHORIZED: "Authentication required",
    INVALID_RESPONSE: "Invalid stream status response from Gateway",
    INTERNAL_ERROR: "An unexpected error occurred",
    NOT_FOUND: "Stream not found",

} as const;

// First attempt to fetch the URL, if it fails, try again with https
async function fetchWithFallback(url: string, authHeader: string) {
    const hasProtocol = url.startsWith('http://') || url.startsWith('https://');
    const urlsToTry = hasProtocol ? [url] : [`http://${url}`, `https://${url}`];

    for (const protocolUrl of urlsToTry) {
        console.debug("Attempting to get stream status: ", protocolUrl);
        try {
            const response = await fetch(protocolUrl, {
                headers: {
                    Authorization: authHeader,
                    'cache-control': 'no-store',
                },
            });
            // If the response is ok or 404 (which assumes the stream was not found), return it
            if (response.ok || response.status === 404) {
                return response;
            } else {
                console.debug(`Request failed with status: ${response.status}`);
            }
        } catch (error) {
            console.debug(`Request error when getting stream status: ${error}`);
        }
    }
    throw new Error(`All attempts to fetch ${url} failed`);
}


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const streamId = (await params).id;
    const { gateway } = await serverConfig();
    const gatewayUrl = gateway.url;
    const username = gateway.userId;
    const password = gateway.password;

    if (!username || !password) {
        return createErrorResponse(200, ERROR_MESSAGES.INTERNAL_ERROR + " - Missing auth credentials.");
    }

    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

    try {
        const { data: stream, error } = await getStream(streamId);
        if (error) {
            return createErrorResponse(404, ERROR_MESSAGES.NOT_FOUND);
        }

        const statusBaseUrl = stream?.gateway_host
            ? `${stream.gateway_host}/live/video-to-video`
            : gatewayUrl;
        if (!statusBaseUrl) {
            return createErrorResponse(200, ERROR_MESSAGES.INTERNAL_ERROR + " - Missing status endpoint URL or gateway host for stream.");
        }

        const response = await fetchWithFallback(`${statusBaseUrl}/${streamId}/status`, authHeader);
        if (!response.ok) {
            const responseMsg = await response.text().then((text: string) => text?.replace(/[\n\r]+/g, ' ').trim());

            //handle 404 as state OFFLINE
            if(response.status === 404){
                return NextResponse.json({ success: true, error: null, data: {'state':'OFFLINE', info: responseMsg} }, { status: 200 });
            }
            return createErrorResponse(200, ERROR_MESSAGES.INVALID_RESPONSE + ` - [${response.status}] ${response.statusText} - ${responseMsg}`);
        }

        const data = await response.json();
        return NextResponse.json({ success: true, error: null, data: data }, { status: 200 });
    } catch (error) {
        return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_ERROR + " - " + error);
    }
}

function createErrorResponse(status: number, message: unknown) {
    return NextResponse.json({ success: false, error: message }, { status });
}
