import fp from "fastify-plugin";
import { PrivyClient } from "@privy-io/server-auth";
import { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    privy: PrivyClient | null;
    authenticate: any;
  }
}

// TODO: Do this properly
export const FISHTANK_API_KEY =
  "lp_r51ndrgi90m8rcfxeox6vej8h46auz1ik0m086plqi96dg3yx1v9rzbdq74es8jw1eqseq";
export const FISHTANK_USER_ID = "FISHTANK";

export const DUMMY_USER_ID = "did:privy:cm4x2cuiw007lh8fcj34919fu"; // Dummy user id (infra email)

export default fp(async function (fastify) {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;

  if (!appId || !appSecret) {
    fastify.log.warn(
      "Privy credentials not configured - authentication disabled",
    );

    return;
  }

  const privy = new PrivyClient(appId, appSecret);

  fastify.decorate("privy", privy);
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      const accessToken = authHeader?.replace(/^Bearer /, "");

      if (!accessToken) {
        throw new Error("No access token provided");
      }

      try {
        if (accessToken === FISHTANK_API_KEY) {
          request.headers["user-id"] = FISHTANK_USER_ID;
          return;
        }

        const verifiedUser = await privy.verifyAuthToken(accessToken);
        request.headers["user-id"] = verifiedUser.userId;
        return;
      } catch (error) {
        fastify.log.error("Failed to verify Privy auth token:", error);
        throw error;
        return;
      }
    },
  );
});
