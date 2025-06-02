import axios from "axios";
import client from "prom-client";

export const registry = new client.Registry();

const LIVEPEER_PROMETHEUS_URL =
  process.env.LIVEPEER_PROMETHEUS_URL || "http://localhost:9091";
export const ENVIRONMENT = process.env.ENVIRONMENT || "local";

export const testSuccessCounter = new client.Counter({
  name: "e2e_test_success_total",
  help: "Total number of successful E2E test runs",
  labelNames: ["test_name", "environment"],
  registers: [registry],
});

export const testFailureCounter = new client.Counter({
  name: "e2e_test_failure_total",
  help: "Total number of failed E2E test runs",
  labelNames: ["test_name", "environment"],
  registers: [registry],
});

export const testDurationGauge = new client.Gauge({
  name: "e2e_test_duration_seconds",
  help: "Duration of the E2E test run in seconds",
  labelNames: ["test_name", "environment"],
  registers: [registry],
});

export const videoVarianceGauge = new client.Gauge({
  name: "e2e_video_frame_variance",
  help: "Pixel variance of a captured video frame center square",
  labelNames: ["test_name", "video_type", "environment"],
  registers: [registry],
});

export const videoEntropyGauge = new client.Gauge({
  name: "e2e_video_frame_entropy",
  help: "Entropy of a captured video frame center square",
  labelNames: ["test_name", "video_type", "environment"],
  registers: [registry],
});

export const videoFrameDiffGauge = new client.Gauge({
  name: "e2e_video_frame_diff_ratio",
  help: "Difference ratio between consecutive video frames",
  labelNames: ["test_name", "video_type", "environment"],
  registers: [registry],
});

export async function pushMetrics() {
  if (!LIVEPEER_PROMETHEUS_URL) {
    console.warn(
      "LIVEPEER_PROMETHEUS_URL is not defined. Skipping metrics POST.",
    );
    return;
  }

  try {
    const metricsPayload = await registry.metrics();

    if (!metricsPayload || metricsPayload.trim() === "") {
      console.log("No metrics data to POST.");
      return;
    }

    console.log(`Attempting to POST metrics to: ${LIVEPEER_PROMETHEUS_URL}`);

    const response = await axios.post(LIVEPEER_PROMETHEUS_URL, metricsPayload, {
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      },
      timeout: 15000,
    });

    console.log(
      `Metrics successfully POSTed to ${LIVEPEER_PROMETHEUS_URL}. Server response status: ${response.status}`,
    );
  } catch (error) {
    const targetUrl = LIVEPEER_PROMETHEUS_URL;
    if (axios.isAxiosError(error)) {
      const errorDetails = error.response
        ? `Status: ${error.response.status}, Response Data: ${JSON.stringify(error.response.data)}`
        : `No response received. ${error.message}`;
      console.error(
        `Failed to POST metrics to ${targetUrl}: ${errorDetails}`,
        error.config ? `Request Config: ${JSON.stringify(error.config)}` : "",
      );
    } else {
      console.error(
        `An unexpected error occurred while trying to POST metrics to ${targetUrl}:`,
        error,
      );
    }
  }
}
