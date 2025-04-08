import { NextRequest, NextResponse } from "next/server";
import { getAppConfig, isProduction, mixpanel } from "@/lib/env";
import type { Mixpanel } from "mixpanel";
const MixpanelLib = require("mixpanel");

let mixpanelClient: Mixpanel | null = null;
if (mixpanel.projectToken) {
  mixpanelClient = MixpanelLib.init(mixpanel.projectToken);
}

async function getGeoData(ip: string | null) {
  if (!ip) return {};

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return {
      $city: data.city,
      $region: data.regionName,
      $country_code: data.countryCode,
      $latitude: data.lat,
      $longitude: data.lon,
    };
  } catch (error) {
    console.error("Error getting geolocation:", error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  console.log(request);
  if (!mixpanelClient) {
    return NextResponse.json(
      { error: "Mixpanel not configured" },
      { status: 500 },
    );
  }
  console.log("a");

  try {
    const { userId, anonymousId, properties } = await request.json();
    console.log(userId, anonymousId, properties);
    const { first_time_properties, ...regularProperties } = properties; // Create alias if needed
    if (anonymousId !== userId) {
      console.log("Aliasing,,,", userId, anonymousId);
      mixpanelClient.alias(userId, anonymousId);
    }

    const app = getAppConfig(request.nextUrl.searchParams);
    console.log(app);

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

    // add geo data to regular properties
    const setProperties = {
      ...regularProperties,
      ...geoData,
    };

    // Track identify event
    mixpanelClient.track("$identify", {
      distinct_id: userId,
      ...setProperties,
    });

    // Set regular properties
    mixpanelClient.people.set(userId, setProperties);

    // Set first-time properties that should only be set once
    if (first_time_properties) {
      mixpanelClient.people.set_once(userId, first_time_properties);
    }

    return NextResponse.json({ status: "User identified successfully" });
  } catch (error) {
    console.error("Error identifying user:", error);
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
