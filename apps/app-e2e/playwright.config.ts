import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

const APP_URL = process.env.TEST_APP_URL;

if (!APP_URL) {
  console.error(
    "Error: TEST_APP_URL environment variable is required for production tests.",
  );
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: APP_URL,
    /* Collect trace for failed tests. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",

    extraHTTPHeaders: {
      Origin: new URL(APP_URL!).origin,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "monitor",
      testIgnore: "*dev*",
      use: {
        contextOptions: {
          permissions: ["clipboard-read", "clipboard-write"],
        },
        ...devices["Desktop Chrome"],
        channel: "chrome",
        headless: true,
        launchOptions: {
          args: [
            "--disable-web-security",
            "--use-fake-device-for-media-stream",
            "--use-file-for-fake-audio-capture=./test-audio.wav",
          ],
        },
      },
    },
  ],
});
