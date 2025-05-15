import { expect, test } from "@playwright/test";
import {
  assertVideoContentChanging,
  assertVideoPlaying,
  selectWhipServer,
  BROADCAST_VIDEO_TEST_ID,
  MIN,
  NUM_SCREENSHOTS,
  OVERALL_TEST_TIMEOUT_MS,
  PLAYBACK_VIDEO_TEST_ID,
  SCREENSHOT_INTERVAL_MS,
  SEND_METRICS,
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

test.describe("Daydream Page Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["camera", "microphone"]);
    await page.goto(selectWhipServer("/create"));
  });

  test.afterEach(async ({}, testInfo) => {
    if (SEND_METRICS) {
      if (testInfo.status === "passed") {
        testSuccessCounter.inc({
          test_name: testInfo.title,
          environment: ENVIRONMENT,
        });
      } else {
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

  test("video elements load and play correctly", async ({ page }) => {
    test.setTimeout(OVERALL_TEST_TIMEOUT_MS);
    const testName = test.info().title;

    try {
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

      console.log("Clipboard contains:", clipboardText);

      await assertVideoPlaying(broadcast);
      await assertVideoPlaying(playback);

      //     const streamInfo = await playback.evaluate((video: HTMLVideoElement) => {
      //       const stream = video.srcObject;
      //       const audioCtx = new AudioContext();
      //       if (!(stream instanceof MediaStream)) {
      //         console.log("No stream found");
      //         return;
      //       }
      // const source = audioCtx.createMediaStreamSource(stream);
      // const analyser = audioCtx.createAnalyser();

      // analyser.fftSize = 2048;
      // const bufferLength = analyser.fftSize;
      // const dataArray = new Uint8Array(bufferLength);

      // source.connect(analyser);

      // function logWaveform() {
      //   analyser.getByteTimeDomainData(dataArray);

      //   // Print a basic snapshot of the waveform (min/max)
      //   const min = Math.min(...dataArray);
      //   const max = Math.max(...dataArray);
      //   console.log(`Waveform: min=${min}, max=${max}, mid=${dataArray[Math.floor(bufferLength / 2)]}`);

      //   // Repeat every 500ms
      //   setTimeout(logWaveform, 500);
      // }

      // logWaveform();
      //     });

      await assertVideoContentChanging(
        broadcast,
        testName,
        "broadcast",
        NUM_SCREENSHOTS,
        SCREENSHOT_INTERVAL_MS,
        100,
        0.5,
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
        3000,
        3,
      );
    } catch (error) {
      page.screenshot({ path: `./screenshots/error.png` });
      console.error("Error in test:", error);
      throw error;
    }
  });
});
