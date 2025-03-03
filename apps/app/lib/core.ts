import { Livepeer } from "livepeer";
import { livepeer as livePeerEnv } from "./env";

export const livepeerSDK = new Livepeer({
  serverURL: livePeerEnv.apiUrl,
  apiKey: livePeerEnv.apiKey,
});
