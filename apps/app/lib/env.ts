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

const MixpanelConfig = z.object({
  projectToken: z.string().min(1).optional(),
});

const AppConfig = z.object({
  whipUrl: z.string().url(),
  rtmpUrl: z.string().url().optional(),
  environment: Environment,
});

const EnvironmentConfig = z.object({
  livepeer: LivepeerConfig,
  intercom: IntercomConfig,
  mixpanel: MixpanelConfig,
  app: AppConfig,
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
    projectToken: process.env.MIXPANEL_PROJECT_TOKEN,
  },
  app: {
    whipUrl: process.env.NEXT_PUBLIC_WHIP_URL,
    rtmpUrl: process.env.NEXT_PUBLIC_RTMP_URL,
    environment: process.env.NEXT_PUBLIC_ENV as Environment,
  },
} as const;

export const config = EnvironmentConfig.parse(envConfig);

export const isProduction = () => config.app.environment === "production";

export const { livepeer, intercom, mixpanel, app } = config;

export const validateEnv = () => {
  try {
    EnvironmentConfig.parse(envConfig);
    console.log("Environment configuration is valid");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid environment configuration:");
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join(".")}: ${err.message}`);
      });
    }
    console.log("Environment validation failed");
  }
};
