import { NextRequest, NextResponse } from "next/server";

async function saveEmailForNotification(email: string): Promise<boolean> {
  try {
    // TODO: Implement actual storage logic
    // DB? hubspot?
    console.log(`Saving email for capacity notification: ${email}`);

    return true;
  } catch (error) {
    console.error("Failed to save email for notification:", error);
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const success = await saveEmailForNotification(email);

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Failed to save email" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in capacity notification API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
