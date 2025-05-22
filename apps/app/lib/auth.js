"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrivyUser = getPrivyUser;
const server_auth_1 = require("@privy-io/server-auth");
const headers_1 = require("next/headers");
require("server-only");
const privy = new server_auth_1.PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
async function getPrivyUser() {
    const headersList = (0, headers_1.headers)();
    const accessToken = headersList.get("Authorization")?.replace(/^Bearer /, "");
    const cookieStore = (0, headers_1.cookies)();
    const privyCookie = cookieStore.get("privy-token");
    if (!accessToken && !privyCookie) {
        return null;
    }
    try {
        const verifiedUser = await privy.verifyAuthToken(accessToken || privyCookie?.value || "");
        return verifiedUser;
    }
    catch (error) {
        console.error("Failed to verify Privy auth token:", error);
        return null;
    }
}
