import { FastifyInstance } from "fastify";
import { z } from "zod";
import { streams, pipelines } from "../db/schema";
import { eq } from "drizzle-orm";
import { LivepeerService } from "./livepeer";
import { newId } from "./id";

const createStreamSchema = z.object({
  pipeline_id: z.string(),
  pipeline_params: z.record(z.any()).optional().default({}),
  name: z.string().optional(),
  from_playground: z.boolean().optional(),
  is_smoke_test: z.boolean().default(false),
});

export type CreateStreamRequest = z.infer<typeof createStreamSchema>;

const createDefaultValues = (pipeline: any) => {
  const inputs = pipeline.config.inputs;
  const primaryInput = inputs.primary;
  const advancedInputs = inputs.advanced;
  const allInputs = [primaryInput, ...advancedInputs];
  return allInputs.reduce((acc: any, input: any) => {
    acc[input.id] = input.defaultValue;
    return acc;
  }, {});
};

const processInputValues = (inputValues: any) => {
  return Object.fromEntries(
    Object.entries(inputValues).map(([key, value]) => {
      try {
        return [key, JSON.parse(value as string)];
      } catch {
        return [key, value];
      }
    }),
  );
};

const getStreamUrl = (
  streamKey: string,
  customWhipServer?: string,
  customOrchestrator?: string,
): string => {
  const defaultWhipUrl = process.env.WHIP_URL;

  if (customWhipServer) {
    if (customWhipServer.includes("<STREAM_KEY>")) {
      return addOrchestratorParam(
        customWhipServer.replace("<STREAM_KEY>", streamKey),
        customOrchestrator ?? null,
      );
    }
    return addOrchestratorParam(
      `${customWhipServer}${streamKey}/whip`,
      customOrchestrator ?? null,
    );
  }

  return addOrchestratorParam(
    `${defaultWhipUrl}${streamKey}/whip`,
    customOrchestrator ?? null,
  );
};

const addOrchestratorParam = (
  url: string,
  orchestrator: string | null,
): string => {
  if (orchestrator) {
    const urlObj = new URL(url);
    urlObj.searchParams.set("orchestrator", orchestrator);
    return urlObj.toString();
  }
  return url;
};

export class StreamsService {
  private livepeerService: LivepeerService;

  constructor(private fastify: FastifyInstance) {
    this.livepeerService = new LivepeerService();
  }

  async createStream(
    body: CreateStreamRequest,
    userId: string,
    searchParams?: URLSearchParams,
  ) {
    const validationResult = createStreamSchema.safeParse(body);
    if (!validationResult.success) {
      throw new z.ZodError(validationResult.error.errors);
    }

    const streamData = validationResult.data;
    const streamId = newId("stream");
    const streamKey = newId("stream_key");

    const pipeline = await this.fastify.db
      .select()
      .from(pipelines)
      .where(eq(pipelines.id, streamData.pipeline_id))
      .limit(1);

    if (pipeline.length === 0) {
      throw new Error(`Pipeline not found: ${streamData.pipeline_id}`);
    }

    const pipelineData = pipeline[0];
    const inputValues = createDefaultValues(pipelineData);
    const processedInputValues = processInputValues(inputValues);

    let livepeerStream;
    try {
      const result = await this.livepeerService.createStream(streamData.name);
      if (result.error) {
        this.fastify.log.error(
          "Error creating livepeer stream. Perhaps the Livepeer Studio API Key is not configured?",
          result.error,
        );
      } else {
        livepeerStream = result.stream;
      }
    } catch (error) {
      this.fastify.log.error("Failed to create Livepeer stream:", error);
    }

    // Generate WHIP URL
    const customWhipServer = searchParams?.get("whipServer");
    const customOrchestrator = searchParams?.get("orchestrator");
    const whipUrl = getStreamUrl(
      streamKey,
      customWhipServer || undefined,
      customOrchestrator || undefined,
    );

    // Create stream payload
    const streamPayload = {
      id: streamId,
      name: streamData.name || `Stream ${streamId}`,
      outputPlaybackId: livepeerStream?.playbackId || "",
      outputStreamUrl: livepeerStream?.streamKey
        ? `${process.env.LIVEPEER_RTMP_URL}/${livepeerStream?.streamKey}`
        : "",
      whipUrl,
      streamKey: streamKey,
      pipelineParams: processedInputValues,
      pipelineId: streamData.pipeline_id,
      author: userId,
      fromPlayground: streamData.from_playground,
      gatewayHost: "",
      isSmokeTest: streamData.is_smoke_test,
    };

    try {
      const [createdStream] = await this.fastify.db
        .insert(streams)
        .values(streamPayload)
        .returning();

      return { data: createdStream, error: null };
    } catch (error: any) {
      this.fastify.log.error("Error creating stream:", error);
      return { data: null, error: error?.message || "Failed to create stream" };
    }
  }

  async getAllStreams(userId: string) {
    try {
      const userStreams = await this.fastify.db
        .select()
        .from(streams)
        .where(eq(streams.author, userId));

      return { data: userStreams, error: null };
    } catch (error: any) {
      this.fastify.log.error("Error getting streams:", error);
      return { data: null, error: error?.message || "Failed to get streams" };
    }
  }

  async deleteStream(streamId: string) {
    try {
      const [deletedStream] = await this.fastify.db
        .delete(streams)
        .where(eq(streams.id, streamId))
        .returning();

      if (!deletedStream) {
        return { data: null, error: "Stream not found" };
      }

      return { data: deletedStream, error: null };
    } catch (error: any) {
      this.fastify.log.error("Error deleting stream:", error);
      return { data: null, error: error?.message || "Failed to delete stream" };
    }
  }
}
