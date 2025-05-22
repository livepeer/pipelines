"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardizeEventData = standardizeEventData;
exports.sendBeaconEvent = sendBeaconEvent;
exports.sendKafkaEvent = sendKafkaEvent;
/**
 * Validates and standardizes event data before sending to Kafka or beacon API
 */
function standardizeEventData(eventType, data, app, host, user) {
    const standardizedData = {
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
function sendBeaconEvent(eventType, data, app, host, user) {
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
async function sendKafkaEvent(eventType, data, app, host, user) {
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
    }
    catch (error) {
        console.error("Error sending Kafka event:", error);
        return `Error sending event: ${error instanceof Error ? error.message : String(error)}`;
    }
}
