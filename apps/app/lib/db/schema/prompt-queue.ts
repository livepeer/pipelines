import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const promptQueue = pgTable(
  "prompt_queue",
  {
    id: uuid().defaultRandom().primaryKey(),
    text: text().notNull(),
    seed: text().notNull(),
    isUser: boolean("is_user").default(false).notNull(),
    sessionId: text("session_id"),
    streamKey: text("stream_key").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
    position: integer().notNull(),
    processed: boolean().default(false).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  table => ({
    positionIdx: index("prompt_queue_position_idx").on(table.position),
    processedIdx: index("prompt_queue_processed_idx").on(table.processed),
    streamKeyIdx: index("prompt_queue_stream_key_idx").on(table.streamKey),
  }),
);

export const promptState = pgTable("prompt_state", {
  id: text().primaryKey(),
  streamKey: text("stream_key").notNull(),
  displayedPrompts: json("displayed_prompts").$type<string[]>().notNull(),
  promptAvatarSeeds: json("prompt_avatar_seeds").$type<string[]>().notNull(),
  userPromptIndices: json("user_prompt_indices").$type<boolean[]>().notNull(),
  promptSessionIds: json("prompt_session_ids").$type<string[]>().notNull(),
  highlightedSince: timestamp("highlighted_since", { withTimezone: true })
    .defaultNow()
    .notNull(),
  isProcessing: boolean("is_processing").default(false).notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
