"use server";

import { getStream } from "@/app/api/streams/get";
import { getGatewayConfig } from "@/lib/serverEnv";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  INVALID_RESPONSE: "Invalid stream status response from Gateway",
  INTERNAL_ERROR: "An unexpected error occurred",
  NOT_FOUND: "Stream not found",
} as const;

// First attempt to fetch the URL, if it fails, try again with https
async function fetchWithFallback(url: string, authHeader: string) {
  const hasProtocol = url.startsWith("http://") || url.startsWith("https://");
  const urlsToTry = hasProtocol ? [url] : [`http://${url}`, `https://${url}`];

  for (const protocolUrl of urlsToTry) {
    console.debug("Attempting to get stream status: ", protocolUrl);
    try {
      const response = await fetch(protocolUrl, {
        headers: {
          Authorization: authHeader,
          "cache-control": "no-store",
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

// Server action function to get stream status
export async function getStreamStatus(
  streamId: string,
  searchParams?: URLSearchParams,
) {
  // Create response type to match the original response format
  type StreamStatusResponse = {
    success: boolean;
    error: unknown | null;
    data?: any;
    status: number;
  };

  let result: StreamStatusResponse = {
    success: false,
    error: null,
    status: 500,
  };

  const gateway = getGatewayConfig(searchParams);
  const gatewayUrl = gateway.url;
  const username = gateway.userId;
  const password = gateway.password;

  if (!username || !password) {
    result.error =
      ERROR_MESSAGES.INTERNAL_ERROR + " - Missing auth credentials.";
    result.status = 200;
    return result;
  }

  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

  try {
    const { data: stream, error } = await getStream(streamId);
    if (error) {
      result.error = ERROR_MESSAGES.NOT_FOUND;
      result.status = 404;
      return result;
    }

    const statusBaseUrl = stream?.gateway_host
      ? `${stream.gateway_host}/live/video-to-video`
      : gatewayUrl;
    if (!statusBaseUrl) {
      result.error =
        ERROR_MESSAGES.INTERNAL_ERROR +
        " - Missing status endpoint URL or gateway host for stream.";
      result.status = 200;
      return result;
    }

    const response = await fetchWithFallback(
      `${statusBaseUrl}/${streamId}/status`,
      authHeader,
    );
    if (!response.ok) {
      const responseMsg = await response
        .text()
        .then((text: string) => text?.replace(/[\n\r]+/g, " ").trim());

      //handle 404 as state OFFLINE
      if (response.status === 404) {
        result.success = true;
        result.error = null;
        result.data = { state: "OFFLINE", info: responseMsg };
        result.status = 200;
        return result;
      }
      result.error =
        ERROR_MESSAGES.INVALID_RESPONSE +
        ` - [${response.status}] ${response.statusText} - ${responseMsg}`;
      result.status = 200;
      return result;
    }

    const data = await response.json();
    result.success = true;
    result.error = null;
    result.data = data;
    result.status = 200;
    return result;
  } catch (error) {
    result.error = ERROR_MESSAGES.INTERNAL_ERROR + " - " + error;
    result.status = 500;
    return result;
  }
}
