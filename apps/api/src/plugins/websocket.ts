import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { WsMessage } from "../types/models";
import { EventEmitter } from "events";

declare module "fastify" {
  interface FastifyInstance {
    websocketBroadcast: EventEmitter;
    broadcastMessage: (message: WsMessage) => void;
  }
}

const websocketPlugin: FastifyPluginAsync = async fastify => {
  await fastify.register(require("@fastify/websocket"));

  const broadcastEmitter = new EventEmitter();
  broadcastEmitter.setMaxListeners(1000); // Allow many WebSocket connections

  fastify.decorate("websocketBroadcast", broadcastEmitter);

  fastify.decorate("broadcastMessage", (message: WsMessage) => {
    broadcastEmitter.emit("message", message);
  });

  fastify.log.info("WebSocket plugin initialized");
};

export default fp(websocketPlugin, {
  name: "websocket",
});
