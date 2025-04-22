import { PrivyClient } from "@privy-io/server-auth";
import { headers } from "next/headers";
import "server-only";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

export async function getPrivyUser() {
  const headersList = headers();
  const accessToken = headersList.get("Authorization")?.replace(/^Bearer /, "");

  if (!accessToken) {
    return null;
  }

  try {
    const verifiedUser = await privy.verifyAuthToken(accessToken);
    return verifiedUser;
  } catch (error) {
    console.error("Failed to verify Privy auth token:", error);
    return null;
  }
}
