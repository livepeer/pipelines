import client from "prom-client";

export const registry = new client.Registry();

const PUSHGATEWAY_URL =
  process.env.LIVEPEER_PROMETHEUS_URL || "http://localhost:9091";
const JOB_NAME = process.env.LIVEPEER_PROMETHEUS_JOB_NAME || "test";
const ENVIRONMENT = process.env.ENVIRONMENT || "local";
const INSTANCE_ID = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_WORKFLOW}-${process.env.GITHUB_RUN_ID}`
  : "local-instance";

export const gateway = new client.Pushgateway(PUSHGATEWAY_URL, {}, registry);

export const testResultGauge = new client.Gauge({
  name: "e2e_test_result",
  help: "Result of the E2E test run (1 = success, 0 = failure)",
  labelNames: ["test_name", "status"],
  registers: [registry],
});

export const testDurationGauge = new client.Gauge({
  name: "e2e_test_duration_seconds",
  help: "Duration of the E2E test run in seconds",
  labelNames: ["test_name"],
  registers: [registry],
});

export const videoVarianceGauge = new client.Gauge({
  name: "e2e_video_frame_variance",
  help: "Pixel variance of a captured video frame center square",
  labelNames: ["test_name", "video_type"],
  registers: [registry],
});

export const videoEntropyGauge = new client.Gauge({
  name: "e2e_video_frame_entropy",
  help: "Entropy of a captured video frame center square",
  labelNames: ["test_name", "video_type"],
  registers: [registry],
});

export const videoFrameDiffGauge = new client.Gauge({
  name: "e2e_video_frame_diff_ratio",
  help: "Difference ratio between consecutive video frames",
  labelNames: ["test_name", "video_type"],
  registers: [registry],
});

export async function pushMetrics() {
  try {
    await gateway.pushAdd({
      jobName: JOB_NAME,
      groupings: {
        instance: INSTANCE_ID,
        environment: ENVIRONMENT,
      },
    });
    console.log(
      `Metrics pushed to Pushgateway (${PUSHGATEWAY_URL}) for job ${JOB_NAME}, instance ${INSTANCE_ID}, environment ${ENVIRONMENT}`,
    );
  } catch (error) {
    console.error("Failed to push metrics to Pushgateway:", error);
  }
}
