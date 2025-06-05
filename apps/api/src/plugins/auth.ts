import fp from "fastify-plugin";
import { PrivyClient } from "@privy-io/server-auth";

declare module "fastify" {
  interface FastifyInstance {
    privy: PrivyClient | null;
    verifyAuth: (request: any) => Promise<{ userId: string | null; user: any }>;
  }
}

export const DUMMY_USER_ID = "did:privy:cm4x2cuiw007lh8fcj34919fu"; // Dummy user id (infra email)

export default fp(async function (fastify) {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    fastify.log.warn(
      "Privy credentials not configured - authentication disabled",
    );

    // Mock authentication for development
    fastify.decorate("privy", null);
    fastify.decorate("verifyAuth", async (request: any) => {
      return { userId: DUMMY_USER_ID, user: { userId: DUMMY_USER_ID } };
    });
    return;
  }

  const privy = new PrivyClient(appId, appSecret);

  fastify.decorate("privy", privy);
  fastify.decorate("verifyAuth", async (request: any) => {
    const authHeader = request.headers.authorization;
    const accessToken = authHeader?.replace(/^Bearer /, "");

    if (!accessToken) {
      return { userId: null, user: null };
    }

    try {
      const verifiedUser = await privy.verifyAuthToken(accessToken);
      return { userId: verifiedUser.userId, user: verifiedUser };
    } catch (error) {
      fastify.log.error("Failed to verify Privy auth token:", error);
      return { userId: null, user: null };
    }
  });
});
