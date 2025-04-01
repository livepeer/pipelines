import { NextRequest, NextResponse } from "next/server";
import { sendKafkaEvent } from "../kafka";
import { getAppConfig } from "@/lib/env";

async function getGeoData(ip: string) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return {
      city: data.city,
      region: data.regionName,
      country: data.countryCode,
      latitude: data.lat,
      longitude: data.lon,
    };
  } catch (error) {
    console.warn("Failed to get geolocation data:", error);
    return {
      city: "",
      region: "",
      country: "",
      latitude: "",
      longitude: "",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data, app, host } = body;

    if (!eventType || !data || !app || !host) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const appConfig = getAppConfig(request.nextUrl.searchParams);
    const ip =
      appConfig.environment === "dev"
        ? "development.fake.ip"
        : forwardedFor
          ? forwardedFor.split(",")[0].trim()
          : "";
    
    const userAgent = request.headers.get("user-agent") || "";

    const geoData = ip && ip !== "127.0.0.1" && ip !== "::1" 
      ? await getGeoData(ip) 
      : {
          city: "",
          region: "",
          country: "",
          latitude: "",
          longitude: "",
        };

    const { viewer_info, broadcaster_info, ...cleanData } = data;

    const enrichedData = {
      ...cleanData,
      user_info: {
        ip,
        country: geoData.country || "",
        city: geoData.city || "",
        region: geoData.region || "",
        user_agent: userAgent,
      },
    };

    await sendKafkaEvent(eventType, enrichedData, app, host);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error processing Kafka request:", error);
    return NextResponse.json(
      { error: "Failed to process Kafka request" },
      { status: 500 }
    );
  }
} 