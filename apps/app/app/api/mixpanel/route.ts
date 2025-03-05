import { NextResponse } from "next/server";
import { app, mixpanel } from "@/lib/env";
import type { Mixpanel } from "mixpanel";
const MixpanelLib = require("mixpanel");

let mixpanelClient: Mixpanel | null = null;
if (mixpanel.projectToken) {
  mixpanelClient = MixpanelLib.init(mixpanel.projectToken);
}

async function getGeoData(ip: string) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return {
      $city: data.city,
      $region: data.regionName,
      mp_country_code: data.countryCode,
      $latitude: data.lat,
      $longitude: data.lon,
    };
  } catch (error) {
    console.warn("Failed to get geolocation data:", error);
    return {};
  }
}

export async function POST(request: Request) {
  if (!mixpanelClient) {
    return NextResponse.json(
      { error: "Mixpanel not configured" },
      { status: 500 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  const ip =
    app.environment === "dev"
      ? "93.152.210.100" // Hardcoded development IP (truncated ip that resolves to San Francisco)
      : forwardedFor
        ? forwardedFor.split(",")[0].trim()
        : "127.0.0.1";

  let geoData = {};
  if (ip && ip !== "127.0.0.1" && ip !== "::1") {
    geoData = await getGeoData(ip);
  }

  try {
    const { event, properties } = await request.json();
    const enrichedProperties = {
      ...properties,
      ...geoData,
    };

    mixpanelClient.track(event, enrichedProperties);
    return NextResponse.json({ status: "Event tracked successfully" });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
