"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptState = exports.promptQueue = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.promptQueue = (0, pg_core_1.pgTable)(
  "prompt_queue",
  {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    text: (0, pg_core_1.text)().notNull(),
    seed: (0, pg_core_1.text)().notNull(),
    isUser: (0, pg_core_1.boolean)("is_user").default(false).notNull(),
    sessionId: (0, pg_core_1.text)("session_id"),
    timestamp: (0, pg_core_1.timestamp)("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
    position: (0, pg_core_1.integer)().notNull(),
    processed: (0, pg_core_1.boolean)().default(false).notNull(),
    processedAt: (0, pg_core_1.timestamp)("processed_at", {
      withTimezone: true,
    }),
  },
  table => ({
    positionIdx: (0, pg_core_1.index)("prompt_queue_position_idx").on(
      table.position,
    ),
    processedIdx: (0, pg_core_1.index)("prompt_queue_processed_idx").on(
      table.processed,
    ),
  }),
);
exports.promptState = (0, pg_core_1.pgTable)("prompt_state", {
  id: (0, pg_core_1.text)().primaryKey().default("main"),
  displayedPrompts: (0, pg_core_1.json)("displayed_prompts").$type().notNull(),
  promptAvatarSeeds: (0, pg_core_1.json)("prompt_avatar_seeds")
    .$type()
    .notNull(),
  userPromptIndices: (0, pg_core_1.json)("user_prompt_indices")
    .$type()
    .notNull(),
  promptSessionIds: (0, pg_core_1.json)("prompt_session_ids").$type().notNull(),
  highlightedSince: (0, pg_core_1.timestamp)("highlighted_since", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  isProcessing: (0, pg_core_1.boolean)("is_processing")
    .default(false)
    .notNull(),
  lastUpdated: (0, pg_core_1.timestamp)("last_updated", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
