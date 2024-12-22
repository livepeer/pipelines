import { mixpanel } from "@/lib/env";
import { NextResponse } from "next/server";
const Mixpanel = require("mixpanel");

let mixpanelClient: any;
if (mixpanel.projectToken) {
  mixpanelClient = Mixpanel.init(mixpanel.projectToken);
}

export async function POST(request: Request) {
  if (!mixpanelClient) {
    return NextResponse.json(
      { error: "Mixpanel not configured" },
      { status: 500 }
    );
  }

  const { distinct_id, anonymous_id } = await request.json();

  try {
    mixpanelClient.alias(distinct_id, anonymous_id);
    return NextResponse.json({ status: "User identified successfully" });
  } catch (error) {
    console.error("Error identifying user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
