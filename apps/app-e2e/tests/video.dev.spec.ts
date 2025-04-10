import { test } from "@playwright/test";
import {
  assertVideoContentChanging,
  assertVideoPlaying,
  BROADCAST_MIN_ENTROPY_THRESHOLD,
  BROADCAST_MIN_VARIANCE_THRESHOLD,
  BROADCAST_VIDEO_TEST_ID,
  NUM_SCREENSHOTS,
  OVERALL_TEST_TIMEOUT_MS,
  PLAYBACK_MIN_ENTROPY_THRESHOLD,
  PLAYBACK_MIN_VARIANCE_THRESHOLD,
  PLAYBACK_VIDEO_TEST_ID,
  SCREENSHOT_INTERVAL_MS,
} from "./common";

test.describe("Daydream Page Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["camera", "microphone"]);
    await page.goto("/");
  });

  test("video elements load and play correctly", async ({ page }) => {
    test.setTimeout(OVERALL_TEST_TIMEOUT_MS);

    const broadcast = page.getByTestId(BROADCAST_VIDEO_TEST_ID);
    const playback = page.getByTestId(PLAYBACK_VIDEO_TEST_ID);

    await assertVideoPlaying(broadcast);
    await assertVideoPlaying(playback);

    await assertVideoContentChanging(
      broadcast,
      NUM_SCREENSHOTS,
      SCREENSHOT_INTERVAL_MS,
      BROADCAST_MIN_VARIANCE_THRESHOLD,
      BROADCAST_MIN_ENTROPY_THRESHOLD,
    );
    await broadcast.evaluate(el => {
      (el as HTMLElement).style.visibility = "hidden";
    });
    await assertVideoContentChanging(
      playback,
      NUM_SCREENSHOTS,
      SCREENSHOT_INTERVAL_MS,
      PLAYBACK_MIN_VARIANCE_THRESHOLD,
      PLAYBACK_MIN_ENTROPY_THRESHOLD,
    );
  });
});
