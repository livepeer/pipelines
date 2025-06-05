import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { StreamsService, CreateStreamRequest } from "../services/streams";
import { DUMMY_USER_ID } from "../plugins/auth";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  INVALID_INPUT: "Invalid stream configuration",
  INTERNAL_ERROR: "An unexpected error occurred",
} as const;

const streamsRoute: FastifyPluginAsync = async fastify => {
  const streamsService = new StreamsService(fastify);

  fastify.post<{ Body: CreateStreamRequest }>(
    "/streams",
    {
      schema: {
        body: {
          type: "object",
          required: ["pipeline_id"],
          properties: {
            pipeline_id: { type: "string", minLength: 1 },
            pipeline_params: { type: "object" },
            name: { type: "string" },
            from_playground: { type: "boolean" },
            is_smoke_test: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = await fastify.verifyAuth(request);

        const body = request.body;
        if (!body) {
          return reply.status(400).send({
            success: false,
            error: ERROR_MESSAGES.INVALID_INPUT,
          });
        }

        const searchParams = new URLSearchParams();
        if (request.query) {
          Object.entries(request.query as Record<string, string>).forEach(
            ([key, value]) => {
              searchParams.set(key, value);
            },
          );
        }

        const result = await streamsService.createStream(
          body,
          userId || DUMMY_USER_ID,
          searchParams,
        );

        if (result.error) {
          return reply.status(500).send({
            success: false,
            error: result.error,
          });
        }

        return reply.status(201).send(result.data);
      } catch (error) {
        fastify.log.error("Error in POST /streams:", error);

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: error.issues,
          });
        }

        const message =
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.INTERNAL_ERROR;
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    },
  );

  fastify.get(
    "/streams",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            user_id: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { user_id } = request.query as { user_id?: string };

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: ERROR_MESSAGES.UNAUTHORIZED,
          });
        }

        const result = await streamsService.getAllStreams(user_id);

        if (result.error) {
          return reply.status(500).send({
            success: false,
            error: result.error,
          });
        }

        return reply.status(200).send({
          success: true,
          data: result.data,
        });
      } catch (error) {
        fastify.log.error("Error in GET /streams:", error);
        return reply.status(500).send({
          success: false,
          error: ERROR_MESSAGES.INTERNAL_ERROR,
        });
      }
    },
  );

  fastify.delete<{ Querystring: { id: string } }>(
    "/streams",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.query;

        const result = await streamsService.deleteStream(id);

        if (result.error) {
          if (result.error === "Stream not found") {
            return reply.status(404).send({
              success: false,
              error: result.error,
            });
          }
          return reply.status(500).send({
            success: false,
            error: result.error,
          });
        }

        return reply.status(200).send({
          success: true,
          data: result.data,
        });
      } catch (error) {
        fastify.log.error("Error in DELETE /streams:", error);
        return reply.status(500).send({
          success: false,
          error: ERROR_MESSAGES.INTERNAL_ERROR,
        });
      }
    },
  );
};

export default streamsRoute;
