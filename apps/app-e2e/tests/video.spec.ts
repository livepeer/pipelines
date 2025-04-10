import { expect, test } from "@playwright/test";
import {
  assertVideoContentChanging,
  assertVideoPlaying,
  BROADCAST_VIDEO_TEST_ID,
  NUM_SCREENSHOTS,
  OVERALL_TEST_TIMEOUT_MS,
  PLAYBACK_VIDEO_TEST_ID,
  SCREENSHOT_INTERVAL_MS,
} from "./common";

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
    await page.goto("/");
  });

  test("video elements load and play correctly", async ({ page }) => {
    test.setTimeout(OVERALL_TEST_TIMEOUT_MS);

    console.log(EMAIL);
    console.log(OTP_CODE);
    const emailInput = page.getByTestId("email-input");
    await expect(emailInput).toBeVisible();
    await emailInput.fill(EMAIL);

    await page.getByTestId("submit-email").click();

    const otpForm = page.getByTestId("otp-form");
    await expect(otpForm).toBeVisible();
    const otpInputElement = otpForm.locator("input");
    await expect(otpInputElement).toBeAttached();
    await otpInputElement.fill(OTP_CODE);

    const broadcast = page.getByTestId(BROADCAST_VIDEO_TEST_ID);
    const playback = page.getByTestId(PLAYBACK_VIDEO_TEST_ID);

    await assertVideoPlaying(broadcast);
    await assertVideoPlaying(playback);

    await assertVideoContentChanging(
      broadcast,
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
      NUM_SCREENSHOTS,
      SCREENSHOT_INTERVAL_MS,
      5000,
      5,
    );
  });
});
