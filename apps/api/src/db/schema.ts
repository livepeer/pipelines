import {
  pgTable,
  index,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  json,
  check,
  varchar,
  jsonb,
  foreignKey,
  serial,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const clipApprovalStatus = pgEnum("clip_approval_status", [
  "none",
  "pending",
  "approved",
  "rejected",
]);
export const clipStatus = pgEnum("clip_status", [
  "uploading",
  "completed",
  "failed",
]);
export const validationStatus = pgEnum("validation_status", [
  "valid",
  "invalid",
  "processing",
  "pending",
]);

export const promptQueue = pgTable(
  "prompt_queue",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    text: text().notNull(),
    seed: text().notNull(),
    isUser: boolean("is_user").default(false).notNull(),
    sessionId: text("session_id"),
    timestamp: timestamp({ withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    position: integer().notNull(),
    processed: boolean().default(false).notNull(),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "string",
    }),
    streamKey: text("stream_key").notNull(),
  },
  table => [
    index("prompt_queue_position_idx").using(
      "btree",
      table.position.asc().nullsLast().op("int4_ops"),
    ),
    index("prompt_queue_processed_idx").using(
      "btree",
      table.processed.asc().nullsLast().op("bool_ops"),
    ),
    index("prompt_queue_stream_key_idx").using(
      "btree",
      table.streamKey.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const promptState = pgTable("prompt_state", {
  id: text().primaryKey().notNull(),
  displayedPrompts: json("displayed_prompts").notNull(),
  promptAvatarSeeds: json("prompt_avatar_seeds").notNull(),
  userPromptIndices: json("user_prompt_indices").notNull(),
  promptSessionIds: json("prompt_session_ids").notNull(),
  highlightedSince: timestamp("highlighted_since", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  isProcessing: boolean("is_processing").default(false).notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  streamKey: text("stream_key").notNull(),
});

export const users = pgTable(
  "users",
  {
    id: text().primaryKey().notNull(),
    name: varchar(),
    email: varchar(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).default(sql`CURRENT_TIMESTAMP`),
    lastLogin: timestamp("last_login", { withTimezone: true, mode: "string" }),
    isActive: boolean("is_active").default(true),
    provider: varchar(),
    additionalDetails: jsonb("additional_details").default({}),
  },
  table => [
    check(
      "users_provider_check",
      sql`(provider)::text = ANY (ARRAY[('discord'::character varying)::text, ('email'::character varying)::text, ('github'::character varying)::text, ('google'::character varying)::text])`,
    ),
  ],
);

export const clips = pgTable(
  "clips",
  {
    id: serial().primaryKey().notNull(),
    videoUrl: text("video_url").notNull(),
    videoTitle: text("video_title"),
    thumbnailUrl: text("thumbnail_url"),
    authorUserId: text("author_user_id").notNull(),
    sourceClipId: integer("source_clip_id"),
    prompt: text().notNull(),
    priority: integer(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    status: clipStatus().default("uploading").notNull(),
    approvalStatus: clipApprovalStatus("approval_status")
      .default("none")
      .notNull(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", {
      withTimezone: true,
      mode: "string",
    }),
    remixCount: integer("remix_count").default(0),
    isTutorial: boolean("is_tutorial").default(false),
  },
  table => [
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: "clips_approved_by_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.authorUserId],
      foreignColumns: [users.id],
      name: "clips_author_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.sourceClipId],
      foreignColumns: [table.id],
      name: "clips_source_clip_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id"),
    apiKey: text("api_key").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    lastUsed: timestamp("last_used", { mode: "string" }),
    isActive: boolean("is_active").default(true),
    name: varchar(),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "api_keys_user_id_fkey",
    }),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    logId: uuid("log_id").defaultRandom().primaryKey().notNull(),
    userId: text("user_id"),
    changeAmount: numeric("change_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    reason: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "audit_logs_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const clipViews = pgTable(
  "clip_views",
  {
    id: serial().primaryKey().notNull(),
    clipId: integer("clip_id").notNull(),
    viewerUserId: text("viewer_user_id"),
    viewedAt: timestamp("viewed_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    sessionId: text("session_id"),
  },
  table => [
    foreignKey({
      columns: [table.clipId],
      foreignColumns: [clips.id],
      name: "clip_views_clip_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.viewerUserId],
      foreignColumns: [users.id],
      name: "clip_views_viewer_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    jobId: uuid("job_id").defaultRandom().primaryKey().notNull(),
    userId: text("user_id"),
    pipelineDetails: json("pipeline_details").notNull(),
    durationS: integer("duration_s").notNull(),
    creditCost: numeric("credit_cost", { precision: 10, scale: 2 }).notNull(),
    ethFees: numeric("eth_fees", { precision: 10, scale: 2 }),
    status: varchar({ length: 50 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "jobs_user_id_fkey",
    }).onDelete("cascade"),
    check(
      "jobs_status_check",
      sql`(status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in-progress'::character varying)::text, ('completed'::character varying)::text])`,
    ),
  ],
);

export const pipelines = pgTable(
  "pipelines",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).default(sql`CURRENT_TIMESTAMP`),
    lastUsed: timestamp("last_used", { withTimezone: true, mode: "string" }),
    name: varchar(),
    description: text(),
    isPrivate: boolean("is_private").default(true),
    coverImage: varchar("cover_image"),
    type: varchar().default("comfyUI"),
    sampleCodeRepo: varchar("sample_code_repo"),
    isFeatured: boolean("is_featured").default(false),
    sampleInputVideo: varchar("sample_input_video"),
    author: text(),
    modelCard: jsonb("model_card").default({}),
    key: text(),
    config: jsonb(),
    comfyUiJson: json("comfy_ui_json"),
    version: text().default("1.0.0").notNull(),
    validationStatus: validationStatus("validation_status")
      .default("pending")
      .notNull(),
    prioritizedParams: jsonb("prioritized_params"),
  },
  table => [
    foreignKey({
      columns: [table.author],
      foreignColumns: [users.id],
      name: "pipelines_author_fkey",
    }),
  ],
);

export const purchases = pgTable(
  "purchases",
  {
    purchaseId: uuid("purchase_id").defaultRandom().primaryKey().notNull(),
    userId: text("user_id"),
    creditsPurchased: numeric("credits_purchased", {
      precision: 10,
      scale: 2,
    }).notNull(),
    amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "purchases_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const sharedParams = pgTable(
  "shared_params",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
      mode: "string",
    }),
    params: jsonb(),
    author: text(),
    pipeline: text(),
    hash: text(),
  },
  table => [
    foreignKey({
      columns: [table.author],
      foreignColumns: [users.id],
      name: "shared_params_author_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.pipeline],
      foreignColumns: [pipelines.id],
      name: "shared_params_pipeline_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const streams = pgTable(
  "streams",
  {
    id: text().primaryKey().notNull(),
    streamKey: text("stream_key").notNull(),
    outputStreamUrl: text("output_stream_url").notNull(),
    pipelineParams: jsonb("pipeline_params"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    pipelineId: text("pipeline_id"),
    outputPlaybackId: text("output_playback_id"),
    name: text(),
    author: text(),
    fromPlayground: boolean("from_playground").default(true),
    gatewayHost: text("gateway_host").default(""),
    isSmokeTest: boolean("is_smoke_test").default(false),
    whipUrl: varchar("whip_url"),
  },
  table => [
    index("streams_stream_key_idx").using(
      "hash",
      table.streamKey.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.author],
      foreignColumns: [users.id],
      name: "streams_author_fkey",
    }),
    foreignKey({
      columns: [table.pipelineId],
      foreignColumns: [pipelines.id],
      name: "streams_pipeline_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const clipSlugs = pgTable(
  "clip_slugs",
  {
    slug: text().primaryKey().notNull(),
    clipId: integer("clip_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.clipId],
      foreignColumns: [clips.id],
      name: "clip_slugs_clip_id_clips_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
