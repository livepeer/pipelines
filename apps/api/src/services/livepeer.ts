import { Livepeer } from "livepeer";

export class LivepeerService {
  private livepeerSDK: Livepeer | null = null;

  constructor() {
    const apiKey = process.env.LIVEPEER_API_KEY;
    const apiUrl = process.env.LIVEPEER_API_URL;

    if (apiKey) {
      this.livepeerSDK = new Livepeer({
        serverURL: apiUrl,
        apiKey: apiKey,
      });
    }
  }

  async createStream(name?: string) {
    if (!this.livepeerSDK) {
      console.warn("Livepeer SDK not configured - API key missing");
      return {
        stream: {
          playbackId: `mock_playback_${Date.now()}`,
          streamKey: `mock_stream_${Date.now()}`,
        },
        error: null,
      };
    }

    try {
      const { stream, error } = await this.livepeerSDK.stream.create({
        name: name || "stream",
      });

      if (error) {
        console.error("Livepeer API error:", error);
        return {
          stream: null,
          error: "Failed to create stream",
        };
      }

      return { stream, error: null };
    } catch (e: any) {
      console.error("Error creating livepeer stream:", e);
      return { stream: null, error: e.message };
    }
  }

  isConfigured(): boolean {
    return this.livepeerSDK !== null;
  }
}
