import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { expect, Locator, test } from "@playwright/test";

export const HAVE_ENOUGH_DATA = 4;

export const SEC = 1000;
export const MIN = 60 * SEC;

export const VIDEO_VISIBLE_TIMEOUT_MS = MIN;
export const POLL_READYSTATE_TIMEOUT_MS = MIN;
export const POLL_PLAYING_TIMEOUT_MS = MIN;
export const PLAYBACK_PROGRESS_CHECK_DELAY_MS = 10 * SEC;
export const OVERALL_TEST_TIMEOUT_MS = 2 * MIN;

export const BROADCAST_VIDEO_TEST_ID = "broadcast-video";
export const PLAYBACK_VIDEO_TEST_ID = "playback-video";

export const NUM_SCREENSHOTS = 4;
export const SCREENSHOT_INTERVAL_MS = 250;
export const MIN_DIFF_THRESHOLD = 300;

export const MIN_VARIANCE_THRESHOLD = 100;
export const MIN_ENTROPY_THRESHOLD = 0.5;

export const EXTENSION = "png";

/**
 * Asserts that a video element is visible, loaded, playing, and progressing.
 * @param video - The Playwright Locator for the video element.
 * @param visibleTimeout - Optional timeout for waiting for visibility. Defaults to VIDEO_VISIBLE_TIMEOUT_MS.
 */
export async function assertVideoPlaying(
  video: Locator,
  visibleTimeout = VIDEO_VISIBLE_TIMEOUT_MS,
) {
  await test.step("Wait for video visibility", async () => {
    await video.waitFor({ state: "visible", timeout: visibleTimeout });
  });

  await test.step("Poll for readyState", async () => {
    await expect
      .poll(
        async () => {
          return video.evaluate(v => (v as HTMLVideoElement).readyState);
        },
        {
          message: `Video readyState did not reach HAVE_ENOUGH_DATA (${HAVE_ENOUGH_DATA})`,
          timeout: POLL_READYSTATE_TIMEOUT_MS,
        },
      )
      .toBeGreaterThanOrEqual(HAVE_ENOUGH_DATA);
  });

  await test.step("Poll for playing state", async () => {
    await expect
      .poll(
        async () => {
          return video.evaluate(v => (v as HTMLVideoElement).paused);
        },
        {
          message: "Video did not start playing (remained paused)",
          timeout: POLL_PLAYING_TIMEOUT_MS,
        },
      )
      .toBeFalsy();
  });

  await test.step("Verify playback progression", async () => {
    const initialTime = await video.evaluate(
      v => (v as HTMLVideoElement).currentTime,
    );

    await video.page().waitForTimeout(PLAYBACK_PROGRESS_CHECK_DELAY_MS);

    const currentTimeAfterDelay = await video.evaluate(
      v => (v as HTMLVideoElement).currentTime,
    );

    expect(
      currentTimeAfterDelay,
      `Video currentTime should increase after ${PLAYBACK_PROGRESS_CHECK_DELAY_MS}ms`,
    ).toBeGreaterThan(initialTime);

    const isPaused = await video.evaluate(v => (v as HTMLVideoElement).paused);
    expect(
      isPaused,
      `Video should not be paused after ${PLAYBACK_PROGRESS_CHECK_DELAY_MS}ms check delay`,
    ).toBeFalsy();
  });
}

/**
 * Takes multiple screenshots of a video element in quick succession,
 * crops them to the center square, and asserts that:
 * 1. Each frame has sufficient pixel variance (is not blank).
 * 2. Each frame has sufficient entropy (i.e. enough information content)
 * 3. Consecutive frames are different from each other.
 * @param video - The Playwright Locator for the video element.
 * @param numFrames - Number of frames to capture. Defaults to NUM_SCREENSHOTS.
 * @param intervalMs - Time between screenshots in milliseconds. Defaults to SCREENSHOT_INTERVAL_MS.
 * @param varianceThreshold - Minimum pixel variance threshold. Defaults to MIN_VARIANCE_THRESHOLD.
 * @param entropyThreshold - Minimum entropy threshold. Defaults to MIN_ENTROPY_THRESHOLD.

 */
export async function assertVideoContentChanging(
  video: Locator,
  numFrames = NUM_SCREENSHOTS,
  intervalMs = SCREENSHOT_INTERVAL_MS,
  varianceThreshold = MIN_VARIANCE_THRESHOLD,
  entropyThreshold = MIN_ENTROPY_THRESHOLD,
) {
  const frameBuffers: Buffer[] = [];
  const processedFrames: {
    buffer: Buffer;
    variance: number;
    entropy: number;
  }[] = [];
  const videoTitle = await video.evaluate(
    v => (v as HTMLVideoElement).ariaLabel || (v as HTMLVideoElement).title,
  );

  await test.step(`Capture ${numFrames} video frames`, async () => {
    for (let i = 0; i < numFrames; i++) {
      const screenshot = await video.screenshot({
        type: EXTENSION,
        path: `screenshots/${videoTitle}/${i}.${EXTENSION}`,
      });
      frameBuffers.push(screenshot);
      if (i < numFrames - 1) {
        await video.page().waitForTimeout(intervalMs);
      }
    }
    expect(frameBuffers.length).toBe(numFrames);
  });

  await test.step("Process and crop frames to center square", async () => {
    for (let i = 0; i < frameBuffers.length; i++) {
      const sharpInstance = sharp(frameBuffers[i]);
      const metadata = await sharpInstance.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error(`Could not get dimensions for frame ${i}`);
      }

      const size = Math.min(metadata.width, metadata.height);
      const left = Math.floor((metadata.width - size) / 2);
      const top = Math.floor((metadata.height - size) / 2);

      const croppedSharp = sharpInstance.extract({
        left,
        top,
        width: size,
        height: size,
      });
      const stats = await croppedSharp.stats();

      const variance =
        stats.channels.reduce((sum, ch) => sum + ch.stdev * ch.stdev, 0) /
        stats.channels.length;

      const processedBuffer = await croppedSharp.png().toBuffer();
      processedFrames.push({
        buffer: processedBuffer,
        variance,
        entropy: stats.entropy,
      });
    }
    expect(processedFrames.length).toBe(numFrames);
  });

  await test.step("Verify intra-frame variance (non-blank)", async () => {
    for (let i = 0; i < processedFrames.length; i++) {
      const { entropy, variance } = processedFrames[i];
      console.log(
        `Frame ${i} - Center Square Entropy: ${entropy.toFixed(2)}, Variance: ${variance.toFixed(2)}`,
      );

      expect(
        variance,
        `Frame <span class="math-inline">\{i\} center square variance \(</span>{variance.toFixed(2)}) should be above threshold (${varianceThreshold})`,
      ).toBeGreaterThan(varianceThreshold);

      expect(
        entropy,
        `Frame <span class="math-inline">\{i\} center square entropy \(</span>{entropy.toFixed(2)}) should be above threshold (${entropyThreshold})`,
      ).toBeGreaterThan(entropyThreshold);
    }
  });

  await test.step("Verify inter-frame differences (content changing)", async () => {
    for (let i = 0; i < processedFrames.length - 1; i++) {
      const buffer1 = processedFrames[i].buffer;
      const buffer2 = processedFrames[i + 1].buffer;
      const image1 = sharp(buffer1);
      const image2 = sharp(buffer2);
      const metadata1 = await image1.metadata();
      if (!metadata1.width || !metadata1.height) {
        throw new Error("Could not get image dimensions");
      }
      const width = metadata1.width;
      const height = metadata1.height;

      const raw1 = await image1.ensureAlpha().raw().toBuffer();
      const raw2 = await image2.ensureAlpha().raw().toBuffer();

      const diffPixelCount = pixelmatch(raw1, raw2, undefined, width, height, {
        threshold: 0.1,
      });

      expect(
        diffPixelCount,
        `Consecutive frames ${i} and ${i + 1} have insufficient differences (${diffPixelCount} differing pixels)`,
      ).toBeGreaterThan(MIN_DIFF_THRESHOLD);
    }
  });
}
