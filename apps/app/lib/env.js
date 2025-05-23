"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv =
  exports.getAppConfig =
  exports.sendgrid =
  exports.hubspot =
  exports.mixpanel =
  exports.intercom =
  exports.livepeer =
  exports.isProduction =
  exports.config =
    void 0;
const zod_1 = require("zod");
const Environment = zod_1.z.enum(["dev", "staging", "production"]);
const LivepeerConfig = zod_1.z.object({
  apiKey: zod_1.z.string().min(1),
  apiUrl: zod_1.z.string().url(),
  rtmpUrl: zod_1.z.string().url().optional(),
});
const IntercomConfig = zod_1.z.object({
  appId: zod_1.z.string().min(1),
});
const HubspotConfig = zod_1.z.object({
  portalId: zod_1.z.string().min(1),
  formId: zod_1.z.string().min(1),
  capacityFormId: zod_1.z.string().min(1),
});
const MixpanelConfig = zod_1.z.object({
  projectToken: zod_1.z.string().min(1).optional(),
});
const AppConfig = zod_1.z.object({
  whipUrl: zod_1.z.string().url(),
  rtmpUrl: zod_1.z.string().url().optional(),
  environment: Environment,
  newWhipUrl: zod_1.z.string().url().optional(),
});
const EnvironmentConfig = zod_1.z.object({
  livepeer: LivepeerConfig,
  intercom: IntercomConfig,
  mixpanel: MixpanelConfig,
  app: AppConfig,
  app_secondary: AppConfig.optional(),
  hubspot: HubspotConfig,
  sendgrid: zod_1.z
    .object({
      apiKey: zod_1.z.string().min(1),
    })
    .optional(),
});
const envConfig = {
  livepeer: {
    apiKey: process.env.NEXT_PUBLIC_LIVEPEER_STUDIO_API_KEY,
    apiUrl: process.env.NEXT_PUBLIC_LIVEPEER_STUDIO_API_URL,
    rtmpUrl: process.env.LIVEPEER_STUDIO_RTMP_URL,
  },
  intercom: {
    appId: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
  },
  mixpanel: {
    projectToken: process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN,
  },
  app: {
    whipUrl: process.env.NEXT_PUBLIC_WHIP_URL,
    rtmpUrl: process.env.NEXT_PUBLIC_RTMP_URL,
    environment: process.env.NEXT_PUBLIC_ENV,
    newWhipUrl: process.env.NEXT_PUBLIC_AI_GATEWAY_API_BASE_URL,
  },
  app_secondary: (process.env.NEXT_PUBLIC_WHIP_URL_SECONDARY ||
    process.env.NEXT_PUBLIC_WHIP_URL) && {
    whipUrl:
      process.env.NEXT_PUBLIC_WHIP_URL_SECONDARY ||
      process.env.NEXT_PUBLIC_WHIP_URL,
    rtmpUrl:
      process.env.NEXT_PUBLIC_RTMP_URL_SECONDARY ||
      process.env.NEXT_PUBLIC_RTMP_URL,
    newWhipUrl:
      process.env.NEXT_PUBLIC_AI_GATEWAY_API_BASE_URL_SECONDARY ||
      process.env.NEXT_PUBLIC_WHIP_URL_SECONDARY,
    environment: process.env.NEXT_PUBLIC_ENV,
  },
  hubspot: {
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID,
    capacityFormId: process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID_CAPACITY,
  },
  sendgrid: process.env.SENDGRID_API_KEY
    ? {
        apiKey: process.env.SENDGRID_API_KEY,
      }
    : undefined,
};
exports.config = EnvironmentConfig.parse(envConfig);
const isProduction = () => exports.config.app.environment === "production";
exports.isProduction = isProduction;
(exports.livepeer = exports.config.livepeer),
  (exports.intercom = exports.config.intercom),
  (exports.mixpanel = exports.config.mixpanel),
  (exports.hubspot = exports.config.hubspot),
  (exports.sendgrid = exports.config.sendgrid);
const getAppConfig = searchParams => {
  const useSecondary =
    !(0, exports.isProduction)() &&
    searchParams?.get("gateway") === "secondary";
  if (useSecondary && exports.config.app_secondary) {
    return exports.config.app_secondary;
  }
  return exports.config.app;
};
exports.getAppConfig = getAppConfig;
const validateEnv = () => {
  try {
    EnvironmentConfig.parse(envConfig);
    console.log("Environment configuration is valid");
  } catch (error) {
    if (error instanceof zod_1.z.ZodError) {
      console.error("Invalid environment configuration:");
      error.errors.forEach(err => {
        console.error(`- ${err.path.join(".")}: ${err.message}`);
      });
    }
    console.log("Environment validation failed");
  }
};
exports.validateEnv = validateEnv;
