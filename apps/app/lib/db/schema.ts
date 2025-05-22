import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  inet,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  pgView,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const validationStatus = pgEnum("validation_status", [
  "valid",
  "invalid",
  "processing",
  "pending",
]);

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
    provider: varchar("provider"),
    additionalDetails: jsonb("additional_details").default({}),
  },
  table => [
    // unique("users_email_key").on(table.email), // ⛑️
    check(
      "users_provider_check",
      sql`(provider)::text = ANY (ARRAY[('discord'::character varying)::text, ('email'::character varying)::text, ('github'::character varying)::text, ('google'::character varying)::text])`,
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

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id"),
    apiKey: text("api_key").notNull(),
    createdAt: timestamp("created_at", {
      mode: "string",
    }).default(sql`CURRENT_TIMESTAMP`),
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
    // unique("api_keys_api_key_key").on(table.apiKey), // ⛑️
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
      sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'completed'::character varying])::text[])`,
    ),
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
    index("streams_stream_key_idx").using("hash", table.streamKey),
  ],
);

export const clipStatusEnum = pgEnum("clip_status", [
  "uploading",
  "completed",
  "failed",
]);

export const clipApprovalEnum = pgEnum("clip_approval_status", [
  "none",
  "pending",
  "approved",
  "rejected",
]);

export const clips = pgTable(
  "clips",
  {
    id: serial("id").primaryKey(),
    video_url: text("video_url").notNull(),
    video_title: text("video_title"),
    thumbnail_url: text("thumbnail_url"),
    author_user_id: text("author_user_id").notNull(),
    source_clip_id: integer("source_clip_id"),
    remix_count: integer("remix_count").default(0),
    prompt: text("prompt").notNull(),
    priority: integer("priority"),
    status: clipStatusEnum("status").default("uploading").notNull(),
    is_tutorial: boolean("is_tutorial").default(false),
    approval_status: clipApprovalEnum("approval_status")
      .default("none")
      .notNull(),
    approved_by: text("approved_by"),
    approved_at: timestamp("approved_at", { withTimezone: true }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  table => [
    foreignKey({
      columns: [table.author_user_id],
      foreignColumns: [users.id],
      name: "clips_author_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),

    foreignKey({
      columns: [table.source_clip_id],
      foreignColumns: [table.id],
      name: "clips_source_clip_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),

    foreignKey({
      columns: [table.approved_by],
      foreignColumns: [users.id],
      name: "clips_approved_by_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const clipViews = pgTable(
  "clip_views",
  {
    id: serial("id").primaryKey(),
    clip_id: integer("clip_id").notNull(),
    viewer_user_id: text("viewer_user_id"),
    viewed_at: timestamp("viewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ip_address: varchar("ip_address", { length: 45 }), // Nullable
    session_id: text("session_id"),
  },
  table => [
    foreignKey({
      columns: [table.clip_id],
      foreignColumns: [clips.id],
      name: "clip_views_clip_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),

    foreignKey({
      columns: [table.viewer_user_id],
      foreignColumns: [users.id],
      name: "clip_views_viewer_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const clipSlugs = pgTable(
  "clip_slugs",
  {
    slug: text("slug").primaryKey(),

    clip_id: integer("clip_id")
      .notNull()
      .references(() => clips.id, { onDelete: "cascade", onUpdate: "cascade" }),

    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => [
    {
      clipIdUniqueConstraint: unique("unq_clip_slugs_clip_id").on(
        table.clip_id,
      ),
    },
  ],
);

export const pgStatMonitor = pgView("pg_stat_monitor", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  bucket: bigint({ mode: "number" }),
  bucketStartTime: timestamp("bucket_start_time", {
    withTimezone: true,
    mode: "string",
  }),
  // TODO: failed to parse database type 'oid'
  userid: text(),
  username: text(),
  // TODO: failed to parse database type 'oid'
  dbid: text(),
  datname: text(),
  clientIp: inet("client_ip"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  pgsmQueryId: bigint("pgsm_query_id", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  queryid: bigint({ mode: "number" }),
  toplevel: boolean(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  topQueryid: bigint("top_queryid", { mode: "number" }),
  query: text(),
  comments: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  planid: bigint({ mode: "number" }),
  queryPlan: text("query_plan"),
  topQuery: text("top_query"),
  applicationName: text("application_name"),
  relations: text(),
  cmdType: integer("cmd_type"),
  cmdTypeText: text("cmd_type_text"),
  elevel: integer(),
  sqlcode: text(),
  message: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  calls: bigint({ mode: "number" }),
  totalExecTime: doublePrecision("total_exec_time"),
  minExecTime: doublePrecision("min_exec_time"),
  maxExecTime: doublePrecision("max_exec_time"),
  meanExecTime: doublePrecision("mean_exec_time"),
  stddevExecTime: doublePrecision("stddev_exec_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  rows: bigint({ mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksHit: bigint("shared_blks_hit", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksRead: bigint("shared_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksDirtied: bigint("shared_blks_dirtied", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksWritten: bigint("shared_blks_written", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksHit: bigint("local_blks_hit", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksRead: bigint("local_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksDirtied: bigint("local_blks_dirtied", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksWritten: bigint("local_blks_written", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tempBlksRead: bigint("temp_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tempBlksWritten: bigint("temp_blks_written", { mode: "number" }),
  blkReadTime: doublePrecision("blk_read_time"),
  blkWriteTime: doublePrecision("blk_write_time"),
  tempBlkReadTime: doublePrecision("temp_blk_read_time"),
  tempBlkWriteTime: doublePrecision("temp_blk_write_time"),
  respCalls: text("resp_calls"),
  cpuUserTime: doublePrecision("cpu_user_time"),
  cpuSysTime: doublePrecision("cpu_sys_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  walRecords: bigint("wal_records", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  walFpi: bigint("wal_fpi", { mode: "number" }),
  walBytes: numeric("wal_bytes"),
  bucketDone: boolean("bucket_done"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  plans: bigint({ mode: "number" }),
  totalPlanTime: doublePrecision("total_plan_time"),
  minPlanTime: doublePrecision("min_plan_time"),
  maxPlanTime: doublePrecision("max_plan_time"),
  meanPlanTime: doublePrecision("mean_plan_time"),
  stddevPlanTime: doublePrecision("stddev_plan_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitFunctions: bigint("jit_functions", { mode: "number" }),
  jitGenerationTime: doublePrecision("jit_generation_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitInliningCount: bigint("jit_inlining_count", { mode: "number" }),
  jitInliningTime: doublePrecision("jit_inlining_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitOptimizationCount: bigint("jit_optimization_count", { mode: "number" }),
  jitOptimizationTime: doublePrecision("jit_optimization_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitEmissionCount: bigint("jit_emission_count", { mode: "number" }),
  jitEmissionTime: doublePrecision("jit_emission_time"),
}).as(
  sql`SELECT pg_stat_monitor_internal.bucket, pg_stat_monitor_internal.bucket_start_time, pg_stat_monitor_internal.userid, pg_stat_monitor_internal.username, pg_stat_monitor_internal.dbid, pg_stat_monitor_internal.datname, '0.0.0.0'::inet + pg_stat_monitor_internal.client_ip AS client_ip, pg_stat_monitor_internal.pgsm_query_id, pg_stat_monitor_internal.queryid, pg_stat_monitor_internal.toplevel, pg_stat_monitor_internal.top_queryid, pg_stat_monitor_internal.query, pg_stat_monitor_internal.comments, pg_stat_monitor_internal.planid, pg_stat_monitor_internal.query_plan, pg_stat_monitor_internal.top_query, pg_stat_monitor_internal.application_name, string_to_array(pg_stat_monitor_internal.relations, ','::text) AS relations, pg_stat_monitor_internal.cmd_type, get_cmd_type(pg_stat_monitor_internal.cmd_type) AS cmd_type_text, pg_stat_monitor_internal.elevel, pg_stat_monitor_internal.sqlcode, pg_stat_monitor_internal.message, pg_stat_monitor_internal.calls, pg_stat_monitor_internal.total_exec_time, pg_stat_monitor_internal.min_exec_time, pg_stat_monitor_internal.max_exec_time, pg_stat_monitor_internal.mean_exec_time, pg_stat_monitor_internal.stddev_exec_time, pg_stat_monitor_internal.rows, pg_stat_monitor_internal.shared_blks_hit, pg_stat_monitor_internal.shared_blks_read, pg_stat_monitor_internal.shared_blks_dirtied, pg_stat_monitor_internal.shared_blks_written, pg_stat_monitor_internal.local_blks_hit, pg_stat_monitor_internal.local_blks_read, pg_stat_monitor_internal.local_blks_dirtied, pg_stat_monitor_internal.local_blks_written, pg_stat_monitor_internal.temp_blks_read, pg_stat_monitor_internal.temp_blks_written, pg_stat_monitor_internal.shared_blk_read_time AS blk_read_time, pg_stat_monitor_internal.shared_blk_write_time AS blk_write_time, pg_stat_monitor_internal.temp_blk_read_time, pg_stat_monitor_internal.temp_blk_write_time, string_to_array(pg_stat_monitor_internal.resp_calls, ','::text) AS resp_calls, pg_stat_monitor_internal.cpu_user_time, pg_stat_monitor_internal.cpu_sys_time, pg_stat_monitor_internal.wal_records, pg_stat_monitor_internal.wal_fpi, pg_stat_monitor_internal.wal_bytes, pg_stat_monitor_internal.bucket_done, pg_stat_monitor_internal.plans, pg_stat_monitor_internal.total_plan_time, pg_stat_monitor_internal.min_plan_time, pg_stat_monitor_internal.max_plan_time, pg_stat_monitor_internal.mean_plan_time, pg_stat_monitor_internal.stddev_plan_time, pg_stat_monitor_internal.jit_functions, pg_stat_monitor_internal.jit_generation_time, pg_stat_monitor_internal.jit_inlining_count, pg_stat_monitor_internal.jit_inlining_time, pg_stat_monitor_internal.jit_optimization_count, pg_stat_monitor_internal.jit_optimization_time, pg_stat_monitor_internal.jit_emission_count, pg_stat_monitor_internal.jit_emission_time FROM pg_stat_monitor_internal(true) pg_stat_monitor_internal(bucket, userid, username, dbid, datname, client_ip, queryid, planid, query, query_plan, pgsm_query_id, top_queryid, top_query, application_name, relations, cmd_type, elevel, sqlcode, message, bucket_start_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, resp_calls, cpu_user_time, cpu_sys_time, wal_records, wal_fpi, wal_bytes, comments, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since, toplevel, bucket_done) ORDER BY pg_stat_monitor_internal.bucket_start_time`,
);

export * from "./schema/prompt-queue";

export const upscaleJobs = pgTable("upscale_jobs", {
  id: text().primaryKey().notNull(),
  status: text().notNull().default("pending"),
  clipUrl: text().notNull(),
  upscaledUrl: text(),
  error: text(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});
