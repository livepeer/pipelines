import { z } from "zod";

const Environment = z.enum(["dev", "staging", "production"]);
type Environment = z.infer<typeof Environment>;

const LivepeerConfig = z.object({
  apiKey: z.string().min(1),
  apiUrl: z.string().url(),
  rtmpUrl: z.string().url().optional(),
});

const IntercomConfig = z.object({
  appId: z.string().min(1),
});

const HubspotConfig = z.object({
  portalId: z.string().min(1),
  formId: z.string().min(1),
});

const MixpanelConfig = z.object({
  projectToken: z.string().min(1).optional(),
});

const AppConfig = z.object({
  whipUrl: z.string().url(),
  rtmpUrl: z.string().url().optional(),
  environment: Environment,
  newWhipUrl: z.string().url().optional(),
});

const EnvironmentConfig = z.object({
  livepeer: LivepeerConfig,
  intercom: IntercomConfig,
  mixpanel: MixpanelConfig,
  app: AppConfig,
  app_secondary: AppConfig.optional(),
  hubspot: HubspotConfig,
});

type EnvironmentConfig = z.infer<typeof EnvironmentConfig>;

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
    environment: process.env.NEXT_PUBLIC_ENV as Environment,
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
      process.env.NEXT_PUBLIC_WHIP_URL_SECONDARY ||
      process.env.NEXT_PUBLIC_AI_GATEWAY_API_BASE_URL,
    environment: process.env.NEXT_PUBLIC_ENV as Environment,
  },
  hubspot: {
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID,
  },
} as const;

export const config = EnvironmentConfig.parse(envConfig);

export const isProduction = () => config.app.environment === "production";

export const { livepeer, intercom, mixpanel, hubspot } = config;

export const getAppConfig = (searchParams?: URLSearchParams) => {
  const useSecondary =
    !isProduction() && searchParams?.get("gateway") === "secondary";

  if (useSecondary && config.app_secondary) {
    return config.app_secondary;
  }

  return config.app;
};

export const validateEnv = () => {
  try {
    EnvironmentConfig.parse(envConfig);
    console.log("Environment configuration is valid");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid environment configuration:");
      error.errors.forEach(err => {
        console.error(`- ${err.path.join(".")}: ${err.message}`);
      });
    }
    console.log("Environment validation failed");
  }
};
