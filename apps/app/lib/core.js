"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.livepeerSDK = void 0;
const livepeer_1 = require("livepeer");
const env_1 = require("./env");
exports.livepeerSDK = new livepeer_1.Livepeer({
  serverURL: env_1.livepeer.apiUrl,
  apiKey: env_1.livepeer.apiKey,
});
