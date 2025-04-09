import { test } from "@playwright/test";
import {
  assertVideoContentChanging,
  assertVideoPlaying,
  BROADCAST_VIDEO_TEST_ID,
  OVERALL_TEST_TIMEOUT_MS,
  PLAYBACK_VIDEO_TEST_ID,
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

    await assertVideoContentChanging(broadcast);
    await broadcast.evaluate(el => {
      (el as HTMLElement).style.visibility = "hidden";
    });
    await assertVideoContentChanging(playback);
  });
});
