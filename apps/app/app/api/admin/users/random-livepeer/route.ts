import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { like, and, not } from "drizzle-orm";
import { requireAdminAuth } from "@/app/api/admin/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authResponse = await requireAdminAuth(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const livepeerUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(
        and(like(users.email, "%@livepeer.org"), not(like(users.email, "%+%"))),
      );

    if (livepeerUsers.length === 0) {
      return NextResponse.json(
        { error: "No Livepeer users found" },
        { status: 404 },
      );
    }

    const randomUser =
      livepeerUsers[Math.floor(Math.random() * livepeerUsers.length)];

    return NextResponse.json(randomUser);
  } catch (error) {
    console.error("Error fetching random Livepeer user:", error);
    return NextResponse.json(
      { error: "Failed to fetch random Livepeer user" },
      { status: 500 },
    );
  }
}
