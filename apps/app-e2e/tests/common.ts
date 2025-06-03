import { expect, Locator, Page, test } from "@playwright/test";
import sharp from "sharp";
import {
  ENVIRONMENT,
  videoEntropyGauge,
  videoFrameDiffGauge,
  videoVarianceGauge,
} from "./metrics";

export const HAVE_ENOUGH_DATA = 4;

export const SEC = 1000;
export const MIN = 60 * SEC;

export const VIDEO_VISIBLE_TIMEOUT_MS = 2 * MIN;
export const POLL_READYSTATE_TIMEOUT_MS = 3 * MIN;
export const POLL_PLAYING_TIMEOUT_MS = MIN;
export const PLAYBACK_PROGRESS_CHECK_DELAY_MS = 10 * SEC;
export const OVERALL_TEST_TIMEOUT_MS = 2 * MIN;

export const BROADCAST_VIDEO_TEST_ID = "broadcast-video";
export const PLAYBACK_VIDEO_TEST_ID = "playback-video";

export const NUM_SCREENSHOTS = 4;
export const SCREENSHOT_INTERVAL_MS = 250;

export const MIN_DIFF_RATIO_THRESHOLD = 0.03;
export const MIN_VARIANCE_THRESHOLD = 100;
export const MIN_ENTROPY_THRESHOLD = 0.3;
export const MIN_AUDIO_DIFF = 0.02;

export const EXTENSION = "png";

export const SEND_METRICS = process.env.SEND_METRICS === "true";

type Logger = Pick<Console, "log">;

/**
 * Randomly selects a WHIP region to communicate with, or fallback to default app behaviour
 * @param path - The path in app to fetch with custom query param including `whipServer`
 */
export function selectWhipServer(path: string): string {
  const REGIONS = (process.env.WHIP_REGIONS || "").split(",");
  let retPath = path;
  if (REGIONS.length > 0 && Math.random() > 0.49) {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    console.log("selected whip region", region);
    retPath = regionalPath(region, path);
  }
  console.log("generated path for request (with WHIP request)", retPath);
  return retPath;
}

export function regionalPath(region: string, path: string): string {
  const qp = process.env.APP_QUERYPARAMS || "";

  return `${path}?${qp != "" ? qp + "&" : qp}whipServer=https://${region}/live/video-to-video/`;
}

/**
 * Asserts that a video element is visible, loaded, playing, and progressing.
 * @param video - The Playwright Locator for the video element.
 * @param visibleTimeout - Optional timeout for waiting for visibility. Defaults to VIDEO_VISIBLE_TIMEOUT_MS.
 */
export async function assertVideoPlaying(
  video: Locator,
  logger: Logger = console,
) {
  const startTime = Date.now();
  let videoVisibleTime: number = 0;
  let readyStateTime: number = 0;
  let playingStateTime: number = 0;

  await test.step("Wait for video visibility", async () => {
    await video.waitFor({
      state: "visible",
      timeout: VIDEO_VISIBLE_TIMEOUT_MS,
    });
    videoVisibleTime = Date.now();
    logger.log(`Video became visible after ${videoVisibleTime - startTime}ms`);
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
    readyStateTime = Date.now();
    logger.log(
      `Video reached HAVE_ENOUGH_DATA after ${readyStateTime - startTime}ms`,
    );
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
    playingStateTime = Date.now();
    logger.log(`Video started playing after ${playingStateTime - startTime}ms`);
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

    const totalTime = Date.now() - startTime;
    logger.log(`Total time from start to verified playback: ${totalTime}ms`);
    logger.log("Video timing breakdown (ms):");
    logger.log(`- Visibility: ${videoVisibleTime - startTime}`);
    logger.log(`- ReadyState: ${readyStateTime - videoVisibleTime}`);
    logger.log(`- Playing: ${playingStateTime - readyStateTime}`);
    logger.log(`- Verified: ${totalTime - playingStateTime}`);
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
  testName: string,
  videoType: "broadcast" | "playback",
  numFrames = NUM_SCREENSHOTS,
  intervalMs = SCREENSHOT_INTERVAL_MS,
  varianceThreshold = MIN_VARIANCE_THRESHOLD,
  entropyThreshold = MIN_ENTROPY_THRESHOLD,
  logger: Logger = console,
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

  let totalVariance = 0;
  let totalEntropy = 0;
  let totalDiffRatio = 0;
  let frameCount = 0;
  let pairCount = 0;

  await test.step(`Capture ${numFrames} video frames`, async () => {
    for (let i = 0; i < numFrames; i++) {
      const screenshot = await video.screenshot({
        type: EXTENSION,
        path: `screenshots/${testName}/${videoTitle}/${i}.${EXTENSION}`,
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
      const entropy = stats.entropy;

      totalVariance += variance;
      totalEntropy += entropy;
      frameCount++;

      const processedBuffer = await croppedSharp.png().toBuffer();
      processedFrames.push({
        buffer: processedBuffer,
        variance,
        entropy,
      });

      logger.log(
        `Frame ${i} (${videoType}) - Center Square Entropy: ${entropy.toFixed(2)}, Variance: ${variance.toFixed(2)}`,
      );
      expect(
        variance,
        `Frame ${i} (${videoType}) center square variance (${variance.toFixed(2)}) should be above threshold (${varianceThreshold})`,
      ).toBeGreaterThan(varianceThreshold);
      expect(
        entropy,
        `Frame ${i} (${videoType}) center square entropy (${entropy.toFixed(2)}) should be above threshold (${entropyThreshold})`,
      ).toBeGreaterThan(entropyThreshold);
    }
    expect(processedFrames.length).toBe(numFrames);
  });

  await test.step("Verify inter-frame differences (content changing)", async () => {
    const pixelmatch = (await import("pixelmatch")).default;

    let maxDiffPercent = 0;
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

      const totalPixels = width * height;
      const diffPercent = diffPixelCount / totalPixels;

      totalDiffRatio += diffPercent;
      pairCount++;

      if (diffPercent > maxDiffPercent) {
        maxDiffPercent = diffPercent;
      }
    }
    expect(
      maxDiffPercent,
      `Frames changed only ${(maxDiffPercent * 100).toFixed(2)}%, should exceed ${(MIN_DIFF_RATIO_THRESHOLD * 100).toFixed(2)}%`,
    ).toBeGreaterThan(MIN_DIFF_RATIO_THRESHOLD);
  });

  await test.step("Calculate averages and set Prometheus metrics", async () => {
    const avgVariance = frameCount > 0 ? totalVariance / frameCount : 0;
    const avgEntropy = frameCount > 0 ? totalEntropy / frameCount : 0;
    const avgDiffRatio = pairCount > 0 ? totalDiffRatio / pairCount : 0;

    logger.log(
      `Averages for ${videoType}: Variance=${avgVariance.toFixed(2)}, Entropy=${avgEntropy.toFixed(2)}, DiffRatio=${(avgDiffRatio * 100).toFixed(2)}%`,
    );

    if (SEND_METRICS) {
      videoVarianceGauge.set(
        {
          test_name: testName,
          video_type: videoType,
          environment: ENVIRONMENT,
        },
        avgVariance,
      );
      videoEntropyGauge.set(
        {
          test_name: testName,
          video_type: videoType,
          environment: ENVIRONMENT,
        },
        avgEntropy,
      );
      videoFrameDiffGauge.set(
        {
          test_name: testName,
          video_type: videoType,
          environment: ENVIRONMENT,
        },
        avgDiffRatio,
      );
    }
  });
}

export async function assertAudioChanging(
  playback: Locator,
  logger: Logger = console,
) {
  const maxChange = await playback.evaluate(async (video: HTMLVideoElement) => {
    const context = new AudioContext();
    const stream = video.srcObject as MediaStream;
    if (!stream || stream.getAudioTracks().length === 0) return -1;

    const analyser = context.createAnalyser();
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const snapshots: Uint8Array[] = [];

    for (let i = 0; i < 10; i++) {
      const data = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(data);
      snapshots.push(data);
      await new Promise(res => setTimeout(res, 250));
    }

    function diff(a: Uint8Array, b: Uint8Array): number {
      let totalDiff = 0,
        totalMax = 0;
      for (let i = 0; i < a.length; i++) {
        totalDiff += Math.abs(a[i] - b[i]);
        totalMax += Math.max(Math.abs(a[i]), Math.abs(b[i]));
      }
      return totalMax === 0 ? 0 : totalDiff / totalMax;
    }

    let maxChange = 0;
    for (let i = 0; i < snapshots.length - 1; i++) {
      maxChange = Math.max(maxChange, diff(snapshots[i], snapshots[i + 1]));
    }

    return maxChange;
  });

  logger.log(`🔊 Max audio change detected: ${(maxChange * 100).toFixed(2)}%`);
  expect(
    maxChange,
    `Frames changed only ${(maxChange * 100).toFixed(2)}%, should exceed ${(MIN_AUDIO_DIFF * 100).toFixed(2)}%`,
  ).toBeGreaterThan(MIN_AUDIO_DIFF);
}
