import { User } from "@/hooks/usePrivy";

interface BaseEventData {
  type: string;
  timestamp: number;
  user_id: string;
  hostname: string;
  user_agent: string;
  [key: string]: any;
}

interface StandardizedEvent {
  eventType: string;
  data: BaseEventData;
  app: string;
  host: string;
}

/**
 * Validates and standardizes event data before sending to Kafka or beacon API
 */
export function standardizeEventData(
  eventType: string,
  data: any,
  app: string,
  host: string,
  user?: User
): StandardizedEvent {
  const standardizedData: BaseEventData = {
    type: data.type,
    timestamp: Date.now(),
    user_id: user?.id || "anonymous",
    hostname: typeof window !== "undefined" ? window.location.hostname : host,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    ...data,
  };

  return {
    eventType,
    data: standardizedData,
    app,
    host,
  };
}

/**
 * Sends an event using the beacon API for page unload events
 */
export function sendBeaconEvent(
  eventType: string,
  data: any,
  app: string,
  host: string,
  user?: User
): boolean {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) {
    console.warn("Beacon API not supported");
    return false;
  }

  const standardizedEvent = standardizeEventData(eventType, data, app, host, user);
  const blob = new Blob([JSON.stringify(standardizedEvent)], {
    type: "application/json",
  });

  return navigator.sendBeacon("/api/metrics/beacon", blob);
}

/**
 * Sends an event using Kafka
 */
export async function sendKafkaEvent(
  eventType: string,
  data: any,
  app: string,
  host: string,
  user?: User
): Promise<string> {
  const standardizedEvent = standardizeEventData(eventType, data, app, host, user);
  
  try {
    const response = await fetch("/api/metrics/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(standardizedEvent),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return "Event sent successfully";
  } catch (error) {
    console.error("Error sending Kafka event:", error);
    return `Error sending event: ${error instanceof Error ? error.message : String(error)}`;
  }
} 