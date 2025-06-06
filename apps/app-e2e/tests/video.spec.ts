import { expect, test, TestInfo } from "@playwright/test";
import {
  assertVideoContentChanging,
  assertVideoPlaying,
  BROADCAST_VIDEO_TEST_ID,
  MIN,
  NUM_SCREENSHOTS,
  OVERALL_TEST_TIMEOUT_MS,
  PLAYBACK_VIDEO_TEST_ID,
  SCREENSHOT_INTERVAL_MS,
  SEND_METRICS,
  regionalPath,
  assertAudioChanging,
} from "./common";
import {
  ENVIRONMENT,
  pushMetrics,
  testDurationGauge,
  testFailureCounter,
  testSuccessCounter,
} from "./metrics";

const EMAIL = process.env.TEST_EMAIL;
const OTP_CODE = process.env.TEST_OTP_CODE;
const APP_URL = process.env.TEST_APP_URL;

if (!EMAIL) {
  throw new Error(
    "TEST_EMAIL environment variable is required for production tests.",
  );
}

if (!OTP_CODE) {
  throw new Error(
    "TEST_OTP_CODE environment variable is required for production tests.",
  );
}

if (!APP_URL) {
  throw new Error(
    "TEST_APP_URL environment variable is required for production tests.",
  );
}

let RUN_COUNT = process.env.RUN_COUNT;
if (!RUN_COUNT) {
  RUN_COUNT = "1";
}

function createTestLogger(testInfo: TestInfo) {
  return {
    log: (message: string) => {
      console.log(
        `[${new Date().toISOString()}] [${testInfo.title}] ${message}`,
      );
    },
  };
}

const whipRegions = (process.env.WHIP_REGIONS || "").split(",");

test.describe.parallel("Daydream Page Tests", () => {
  whipRegions.forEach(region => {
    test.describe.serial("Repeated runs", () => {
      test.beforeEach(async ({ context }) => {
        await context.grantPermissions(["camera", "microphone"]);
      });

      test.afterEach(async ({ page }, testInfo) => {
        const logger = createTestLogger(test.info());
        if (testInfo.status !== testInfo.expectedStatus) {
          await page.screenshot({
            path: `./screenshots/${testInfo.title}/error.png`,
            fullPage: true,
          });
        }

        if (SEND_METRICS) {
          if (testInfo.status === "passed") {
            testSuccessCounter.inc({
              test_name: testInfo.title,
              environment: ENVIRONMENT,
            });
          } else {
            logger.log(
              `Test ${testInfo.title} failed, writing fail metric. Status: ${testInfo.status}`,
            );
            testFailureCounter.inc({
              test_name: testInfo.title,
              environment: ENVIRONMENT,
            });
          }

          testDurationGauge.set(
            { test_name: testInfo.title, environment: ENVIRONMENT },
            testInfo.duration / 1000,
          );

          await pushMetrics();
        }
      });
      for (let i = 0; i < parseInt(RUN_COUNT); i++) {
        test(`video elements load and play correctly ${region}#${i + 1}`, async ({
          page,
        }) => {
          const logger = createTestLogger(test.info());
          const path = regionalPath(region, "/create");
          logger.log(
            `Running test ${i + 1} for region ${region} with path ${path}`,
          );

          page.on("console", msg => {
            logger.log(`Browser console: ${msg.text()}`);
          });

          await page.goto(path);
          test.setTimeout(OVERALL_TEST_TIMEOUT_MS);
          const testName = test.info().title;

          const emailInput = page.getByTestId("email-input");
          await expect(emailInput).toBeVisible({ timeout: 10 * MIN }); // Might still be building
          await emailInput.fill(EMAIL);

          await page.getByTestId("submit-email").click();

          const otpForm = page.getByTestId("otp-form");
          await expect(otpForm).toBeVisible({ timeout: MIN });
          const otpInputElement = otpForm.locator("input");
          await expect(otpInputElement).toBeAttached({ timeout: MIN });
          await otpInputElement.fill(OTP_CODE);

          const broadcast = page.getByTestId(BROADCAST_VIDEO_TEST_ID);
          const playback = page.getByTestId(PLAYBACK_VIDEO_TEST_ID);

          await page.locator('[title="Copy system info"]').click();
          await page.waitForTimeout(10);
          const clipboardText = await page.evaluate(async () => {
            return await navigator.clipboard.readText();
          });

          logger.log(`Stream info: ${clipboardText.replace(/[\r\n]+/g, "")}`);

          await assertVideoPlaying(broadcast, logger);
          const broadcastMute = page.getByTestId("broadcast-mute");
          await broadcast.hover();
          const enableAudioCheck = await broadcastMute.isVisible();
          if (enableAudioCheck) {
            const micEnabled = await broadcastMute.getAttribute("data-enabled");
            if (micEnabled !== "true") {
              logger.log("Unmuting broadcast audio");
              await broadcastMute.click();
            }
          } else {
            logger.log("Audio check disabled");
          }

          await assertVideoPlaying(playback, logger);
          if (enableAudioCheck) {
            await assertAudioChanging(playback, logger);
          }

          // sleep to leave the stream running for longer
          logger.log("Sleeping to allow the stream to run...");
          await page.waitForTimeout(10 * 1000);

          await assertVideoContentChanging(
            broadcast,
            testName,
            "broadcast",
            NUM_SCREENSHOTS,
            SCREENSHOT_INTERVAL_MS,
            100,
            0.5,
            logger,
          );
          await broadcast.evaluate(el => {
            (el as HTMLElement).style.visibility = "hidden";
          });
          await assertVideoContentChanging(
            playback,
            testName,
            "playback",
            NUM_SCREENSHOTS,
            SCREENSHOT_INTERVAL_MS,
            2000,
            3,
            logger,
          );
        });
      }
    });
  });
});
