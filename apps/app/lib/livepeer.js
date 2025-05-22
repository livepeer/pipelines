"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.livepeer = void 0;
const livepeer_1 = require("livepeer");
if (!process.env.NEXT_PUBLIC_STUDIO_API_KEY ||
    !process.env.NEXT_PUBLIC_STUDIO_BASE_URL) {
    throw new Error("Missing studio API key or base URL");
}
exports.livepeer = new livepeer_1.Livepeer({
    apiKey: process.env.NEXT_PUBLIC_STUDIO_API_KEY,
    serverURL: process.env.NEXT_PUBLIC_STUDIO_BASE_URL,
});
