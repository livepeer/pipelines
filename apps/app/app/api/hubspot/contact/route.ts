import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { portalId, formId, fields } = await request.json();

    if (!portalId || !formId || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const url = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("HubSpot API error:", result);
      return NextResponse.json(
        { error: "Error submitting to HubSpot", details: result },
        { status: response.status },
      );
    }

    return NextResponse.json({
      status: "Contact submitted successfully",
      result,
    });
  } catch (error) {
    console.error("Error submitting contact to HubSpot:", error);
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
