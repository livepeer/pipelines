"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.upscaleJobs =
  exports.pgStatMonitor =
  exports.clipSlugs =
  exports.clipViews =
  exports.clips =
  exports.clipApprovalEnum =
  exports.clipStatusEnum =
  exports.streams =
  exports.auditLogs =
  exports.purchases =
  exports.jobs =
  exports.apiKeys =
  exports.pipelines =
  exports.users =
  exports.sharedParams =
  exports.validationStatus =
    void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.validationStatus = (0, pg_core_1.pgEnum)("validation_status", [
  "valid",
  "invalid",
  "processing",
  "pending",
]);
exports.sharedParams = (0, pg_core_1.pgTable)(
  "shared_params",
  {
    id: (0, pg_core_1.text)().primaryKey().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    lastSeenAt: (0, pg_core_1.timestamp)("last_seen_at", {
      withTimezone: true,
      mode: "string",
    }),
    params: (0, pg_core_1.jsonb)(),
    author: (0, pg_core_1.text)(),
    pipeline: (0, pg_core_1.text)(),
    hash: (0, pg_core_1.text)(),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.author],
      foreignColumns: [exports.users.id],
      name: "shared_params_author_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
      columns: [table.pipeline],
      foreignColumns: [exports.pipelines.id],
      name: "shared_params_pipeline_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);
exports.users = (0, pg_core_1.pgTable)(
  "users",
  {
    id: (0, pg_core_1.text)().primaryKey().notNull(),
    name: (0, pg_core_1.varchar)(),
    email: (0, pg_core_1.varchar)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
      mode: "string",
    }).default((0, drizzle_orm_1.sql)`CURRENT_TIMESTAMP`),
    lastLogin: (0, pg_core_1.timestamp)("last_login", {
      withTimezone: true,
      mode: "string",
    }),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    provider: (0, pg_core_1.varchar)("provider"),
    additionalDetails: (0, pg_core_1.jsonb)("additional_details").default({}),
  },
  table => [
    // unique("users_email_key").on(table.email), // ⛑️
    (0, pg_core_1.check)(
      "users_provider_check",
      (0,
      drizzle_orm_1.sql)`(provider)::text = ANY (ARRAY[('discord'::character varying)::text, ('email'::character varying)::text, ('github'::character varying)::text, ('google'::character varying)::text])`,
    ),
  ],
);
exports.pipelines = (0, pg_core_1.pgTable)(
  "pipelines",
  {
    id: (0, pg_core_1.text)().primaryKey().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
      mode: "string",
    }).default((0, drizzle_orm_1.sql)`CURRENT_TIMESTAMP`),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", {
      withTimezone: true,
      mode: "string",
    }).default((0, drizzle_orm_1.sql)`CURRENT_TIMESTAMP`),
    lastUsed: (0, pg_core_1.timestamp)("last_used", {
      withTimezone: true,
      mode: "string",
    }),
    name: (0, pg_core_1.varchar)(),
    description: (0, pg_core_1.text)(),
    isPrivate: (0, pg_core_1.boolean)("is_private").default(true),
    coverImage: (0, pg_core_1.varchar)("cover_image"),
    type: (0, pg_core_1.varchar)().default("comfyUI"),
    sampleCodeRepo: (0, pg_core_1.varchar)("sample_code_repo"),
    isFeatured: (0, pg_core_1.boolean)("is_featured").default(false),
    sampleInputVideo: (0, pg_core_1.varchar)("sample_input_video"),
    author: (0, pg_core_1.text)(),
    modelCard: (0, pg_core_1.jsonb)("model_card").default({}),
    key: (0, pg_core_1.text)(),
    config: (0, pg_core_1.jsonb)(),
    comfyUiJson: (0, pg_core_1.json)("comfy_ui_json"),
    version: (0, pg_core_1.text)().default("1.0.0").notNull(),
    validationStatus: (0, exports.validationStatus)("validation_status")
      .default("pending")
      .notNull(),
    prioritizedParams: (0, pg_core_1.jsonb)("prioritized_params"),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.author],
      foreignColumns: [exports.users.id],
      name: "pipelines_author_fkey",
    }),
  ],
);
exports.apiKeys = (0, pg_core_1.pgTable)(
  "api_keys",
  {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.text)("user_id"),
    apiKey: (0, pg_core_1.text)("api_key").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      mode: "string",
    }).default((0, drizzle_orm_1.sql)`CURRENT_TIMESTAMP`),
    lastUsed: (0, pg_core_1.timestamp)("last_used", { mode: "string" }),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    name: (0, pg_core_1.varchar)(),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.userId],
      foreignColumns: [exports.users.id],
      name: "api_keys_user_id_fkey",
    }),
    // unique("api_keys_api_key_key").on(table.apiKey), // ⛑️
  ],
);
exports.jobs = (0, pg_core_1.pgTable)(
  "jobs",
  {
    jobId: (0, pg_core_1.uuid)("job_id").defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.text)("user_id"),
    pipelineDetails: (0, pg_core_1.json)("pipeline_details").notNull(),
    durationS: (0, pg_core_1.integer)("duration_s").notNull(),
    creditCost: (0, pg_core_1.numeric)("credit_cost", {
      precision: 10,
      scale: 2,
    }).notNull(),
    ethFees: (0, pg_core_1.numeric)("eth_fees", { precision: 10, scale: 2 }),
    status: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.userId],
      foreignColumns: [exports.users.id],
      name: "jobs_user_id_fkey",
    }).onDelete("cascade"),
    (0, pg_core_1.check)(
      "jobs_status_check",
      (0,
      drizzle_orm_1.sql)`(status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'completed'::character varying])::text[])`,
    ),
  ],
);
exports.purchases = (0, pg_core_1.pgTable)(
  "purchases",
  {
    purchaseId: (0, pg_core_1.uuid)("purchase_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    userId: (0, pg_core_1.text)("user_id"),
    creditsPurchased: (0, pg_core_1.numeric)("credits_purchased", {
      precision: 10,
      scale: 2,
    }).notNull(),
    amountPaid: (0, pg_core_1.numeric)("amount_paid", {
      precision: 10,
      scale: 2,
    }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.userId],
      foreignColumns: [exports.users.id],
      name: "purchases_user_id_fkey",
    }).onDelete("cascade"),
  ],
);
exports.auditLogs = (0, pg_core_1.pgTable)(
  "audit_logs",
  {
    logId: (0, pg_core_1.uuid)("log_id").defaultRandom().primaryKey().notNull(),
    userId: (0, pg_core_1.text)("user_id"),
    changeAmount: (0, pg_core_1.numeric)("change_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    reason: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.userId],
      foreignColumns: [exports.users.id],
      name: "audit_logs_user_id_fkey",
    }).onDelete("cascade"),
  ],
);
exports.streams = (0, pg_core_1.pgTable)(
  "streams",
  {
    id: (0, pg_core_1.text)().primaryKey().notNull(),
    streamKey: (0, pg_core_1.text)("stream_key").notNull(),
    outputStreamUrl: (0, pg_core_1.text)("output_stream_url").notNull(),
    pipelineParams: (0, pg_core_1.jsonb)("pipeline_params"),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    pipelineId: (0, pg_core_1.text)("pipeline_id"),
    outputPlaybackId: (0, pg_core_1.text)("output_playback_id"),
    name: (0, pg_core_1.text)(),
    author: (0, pg_core_1.text)(),
    fromPlayground: (0, pg_core_1.boolean)("from_playground").default(true),
    gatewayHost: (0, pg_core_1.text)("gateway_host").default(""),
    isSmokeTest: (0, pg_core_1.boolean)("is_smoke_test").default(false),
    whipUrl: (0, pg_core_1.varchar)("whip_url"),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.author],
      foreignColumns: [exports.users.id],
      name: "streams_author_fkey",
    }),
    (0, pg_core_1.foreignKey)({
      columns: [table.pipelineId],
      foreignColumns: [exports.pipelines.id],
      name: "streams_pipeline_id_fkey",
    }).onDelete("cascade"),
    (0, pg_core_1.index)("streams_stream_key_idx").using(
      "hash",
      table.streamKey,
    ),
  ],
);
exports.clipStatusEnum = (0, pg_core_1.pgEnum)("clip_status", [
  "uploading",
  "completed",
  "failed",
]);
exports.clipApprovalEnum = (0, pg_core_1.pgEnum)("clip_approval_status", [
  "none",
  "pending",
  "approved",
  "rejected",
]);
exports.clips = (0, pg_core_1.pgTable)(
  "clips",
  {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    video_url: (0, pg_core_1.text)("video_url").notNull(),
    video_title: (0, pg_core_1.text)("video_title"),
    thumbnail_url: (0, pg_core_1.text)("thumbnail_url"),
    author_user_id: (0, pg_core_1.text)("author_user_id").notNull(),
    source_clip_id: (0, pg_core_1.integer)("source_clip_id"),
    remix_count: (0, pg_core_1.integer)("remix_count").default(0),
    prompt: (0, pg_core_1.text)("prompt").notNull(),
    priority: (0, pg_core_1.integer)("priority"),
    status: (0, exports.clipStatusEnum)("status")
      .default("uploading")
      .notNull(),
    is_tutorial: (0, pg_core_1.boolean)("is_tutorial").default(false),
    approval_status: (0, exports.clipApprovalEnum)("approval_status")
      .default("none")
      .notNull(),
    approved_by: (0, pg_core_1.text)("approved_by"),
    approved_at: (0, pg_core_1.timestamp)("approved_at", {
      withTimezone: true,
    }),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: (0, pg_core_1.timestamp)("deleted_at", { withTimezone: true }),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.author_user_id],
      foreignColumns: [exports.users.id],
      name: "clips_author_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
      columns: [table.source_clip_id],
      foreignColumns: [table.id],
      name: "clips_source_clip_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    (0, pg_core_1.foreignKey)({
      columns: [table.approved_by],
      foreignColumns: [exports.users.id],
      name: "clips_approved_by_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);
exports.clipViews = (0, pg_core_1.pgTable)(
  "clip_views",
  {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clip_id: (0, pg_core_1.integer)("clip_id").notNull(),
    viewer_user_id: (0, pg_core_1.text)("viewer_user_id"),
    viewed_at: (0, pg_core_1.timestamp)("viewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ip_address: (0, pg_core_1.varchar)("ip_address", { length: 45 }), // Nullable
    session_id: (0, pg_core_1.text)("session_id"),
  },
  table => [
    (0, pg_core_1.foreignKey)({
      columns: [table.clip_id],
      foreignColumns: [exports.clips.id],
      name: "clip_views_clip_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
      columns: [table.viewer_user_id],
      foreignColumns: [exports.users.id],
      name: "clip_views_viewer_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);
exports.clipSlugs = (0, pg_core_1.pgTable)(
  "clip_slugs",
  {
    slug: (0, pg_core_1.text)("slug").primaryKey(),
    clip_id: (0, pg_core_1.integer)("clip_id")
      .notNull()
      .references(() => exports.clips.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    created_at: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
    }).defaultNow(),
  },
  table => [
    {
      clipIdUniqueConstraint: (0, pg_core_1.unique)(
        "unq_clip_slugs_clip_id",
      ).on(table.clip_id),
    },
  ],
);
exports.pgStatMonitor = (0, pg_core_1.pgView)("pg_stat_monitor", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  bucket: (0, pg_core_1.bigint)({ mode: "number" }),
  bucketStartTime: (0, pg_core_1.timestamp)("bucket_start_time", {
    withTimezone: true,
    mode: "string",
  }),
  // TODO: failed to parse database type 'oid'
  userid: (0, pg_core_1.text)(),
  username: (0, pg_core_1.text)(),
  // TODO: failed to parse database type 'oid'
  dbid: (0, pg_core_1.text)(),
  datname: (0, pg_core_1.text)(),
  clientIp: (0, pg_core_1.inet)("client_ip"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  pgsmQueryId: (0, pg_core_1.bigint)("pgsm_query_id", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  queryid: (0, pg_core_1.bigint)({ mode: "number" }),
  toplevel: (0, pg_core_1.boolean)(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  topQueryid: (0, pg_core_1.bigint)("top_queryid", { mode: "number" }),
  query: (0, pg_core_1.text)(),
  comments: (0, pg_core_1.text)(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  planid: (0, pg_core_1.bigint)({ mode: "number" }),
  queryPlan: (0, pg_core_1.text)("query_plan"),
  topQuery: (0, pg_core_1.text)("top_query"),
  applicationName: (0, pg_core_1.text)("application_name"),
  relations: (0, pg_core_1.text)(),
  cmdType: (0, pg_core_1.integer)("cmd_type"),
  cmdTypeText: (0, pg_core_1.text)("cmd_type_text"),
  elevel: (0, pg_core_1.integer)(),
  sqlcode: (0, pg_core_1.text)(),
  message: (0, pg_core_1.text)(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  calls: (0, pg_core_1.bigint)({ mode: "number" }),
  totalExecTime: (0, pg_core_1.doublePrecision)("total_exec_time"),
  minExecTime: (0, pg_core_1.doublePrecision)("min_exec_time"),
  maxExecTime: (0, pg_core_1.doublePrecision)("max_exec_time"),
  meanExecTime: (0, pg_core_1.doublePrecision)("mean_exec_time"),
  stddevExecTime: (0, pg_core_1.doublePrecision)("stddev_exec_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  rows: (0, pg_core_1.bigint)({ mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksHit: (0, pg_core_1.bigint)("shared_blks_hit", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksRead: (0, pg_core_1.bigint)("shared_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksDirtied: (0, pg_core_1.bigint)("shared_blks_dirtied", {
    mode: "number",
  }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  sharedBlksWritten: (0, pg_core_1.bigint)("shared_blks_written", {
    mode: "number",
  }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksHit: (0, pg_core_1.bigint)("local_blks_hit", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksRead: (0, pg_core_1.bigint)("local_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksDirtied: (0, pg_core_1.bigint)("local_blks_dirtied", {
    mode: "number",
  }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  localBlksWritten: (0, pg_core_1.bigint)("local_blks_written", {
    mode: "number",
  }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tempBlksRead: (0, pg_core_1.bigint)("temp_blks_read", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  tempBlksWritten: (0, pg_core_1.bigint)("temp_blks_written", {
    mode: "number",
  }),
  blkReadTime: (0, pg_core_1.doublePrecision)("blk_read_time"),
  blkWriteTime: (0, pg_core_1.doublePrecision)("blk_write_time"),
  tempBlkReadTime: (0, pg_core_1.doublePrecision)("temp_blk_read_time"),
  tempBlkWriteTime: (0, pg_core_1.doublePrecision)("temp_blk_write_time"),
  respCalls: (0, pg_core_1.text)("resp_calls"),
  cpuUserTime: (0, pg_core_1.doublePrecision)("cpu_user_time"),
  cpuSysTime: (0, pg_core_1.doublePrecision)("cpu_sys_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  walRecords: (0, pg_core_1.bigint)("wal_records", { mode: "number" }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  walFpi: (0, pg_core_1.bigint)("wal_fpi", { mode: "number" }),
  walBytes: (0, pg_core_1.numeric)("wal_bytes"),
  bucketDone: (0, pg_core_1.boolean)("bucket_done"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  plans: (0, pg_core_1.bigint)({ mode: "number" }),
  totalPlanTime: (0, pg_core_1.doublePrecision)("total_plan_time"),
  minPlanTime: (0, pg_core_1.doublePrecision)("min_plan_time"),
  maxPlanTime: (0, pg_core_1.doublePrecision)("max_plan_time"),
  meanPlanTime: (0, pg_core_1.doublePrecision)("mean_plan_time"),
  stddevPlanTime: (0, pg_core_1.doublePrecision)("stddev_plan_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitFunctions: (0, pg_core_1.bigint)("jit_functions", { mode: "number" }),
  jitGenerationTime: (0, pg_core_1.doublePrecision)("jit_generation_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitInliningCount: (0, pg_core_1.bigint)("jit_inlining_count", {
    mode: "number",
  }),
  jitInliningTime: (0, pg_core_1.doublePrecision)("jit_inlining_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitOptimizationCount: (0, pg_core_1.bigint)("jit_optimization_count", {
    mode: "number",
  }),
  jitOptimizationTime: (0, pg_core_1.doublePrecision)("jit_optimization_time"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  jitEmissionCount: (0, pg_core_1.bigint)("jit_emission_count", {
    mode: "number",
  }),
  jitEmissionTime: (0, pg_core_1.doublePrecision)("jit_emission_time"),
}).as(
  (0,
  drizzle_orm_1.sql)`SELECT pg_stat_monitor_internal.bucket, pg_stat_monitor_internal.bucket_start_time, pg_stat_monitor_internal.userid, pg_stat_monitor_internal.username, pg_stat_monitor_internal.dbid, pg_stat_monitor_internal.datname, '0.0.0.0'::inet + pg_stat_monitor_internal.client_ip AS client_ip, pg_stat_monitor_internal.pgsm_query_id, pg_stat_monitor_internal.queryid, pg_stat_monitor_internal.toplevel, pg_stat_monitor_internal.top_queryid, pg_stat_monitor_internal.query, pg_stat_monitor_internal.comments, pg_stat_monitor_internal.planid, pg_stat_monitor_internal.query_plan, pg_stat_monitor_internal.top_query, pg_stat_monitor_internal.application_name, string_to_array(pg_stat_monitor_internal.relations, ','::text) AS relations, pg_stat_monitor_internal.cmd_type, get_cmd_type(pg_stat_monitor_internal.cmd_type) AS cmd_type_text, pg_stat_monitor_internal.elevel, pg_stat_monitor_internal.sqlcode, pg_stat_monitor_internal.message, pg_stat_monitor_internal.calls, pg_stat_monitor_internal.total_exec_time, pg_stat_monitor_internal.min_exec_time, pg_stat_monitor_internal.max_exec_time, pg_stat_monitor_internal.mean_exec_time, pg_stat_monitor_internal.stddev_exec_time, pg_stat_monitor_internal.rows, pg_stat_monitor_internal.shared_blks_hit, pg_stat_monitor_internal.shared_blks_read, pg_stat_monitor_internal.shared_blks_dirtied, pg_stat_monitor_internal.shared_blks_written, pg_stat_monitor_internal.local_blks_hit, pg_stat_monitor_internal.local_blks_read, pg_stat_monitor_internal.local_blks_dirtied, pg_stat_monitor_internal.local_blks_written, pg_stat_monitor_internal.temp_blks_read, pg_stat_monitor_internal.temp_blks_written, pg_stat_monitor_internal.shared_blk_read_time AS blk_read_time, pg_stat_monitor_internal.shared_blk_write_time AS blk_write_time, pg_stat_monitor_internal.temp_blk_read_time, pg_stat_monitor_internal.temp_blk_write_time, string_to_array(pg_stat_monitor_internal.resp_calls, ','::text) AS resp_calls, pg_stat_monitor_internal.cpu_user_time, pg_stat_monitor_internal.cpu_sys_time, pg_stat_monitor_internal.wal_records, pg_stat_monitor_internal.wal_fpi, pg_stat_monitor_internal.wal_bytes, pg_stat_monitor_internal.bucket_done, pg_stat_monitor_internal.plans, pg_stat_monitor_internal.total_plan_time, pg_stat_monitor_internal.min_plan_time, pg_stat_monitor_internal.max_plan_time, pg_stat_monitor_internal.mean_plan_time, pg_stat_monitor_internal.stddev_plan_time, pg_stat_monitor_internal.jit_functions, pg_stat_monitor_internal.jit_generation_time, pg_stat_monitor_internal.jit_inlining_count, pg_stat_monitor_internal.jit_inlining_time, pg_stat_monitor_internal.jit_optimization_count, pg_stat_monitor_internal.jit_optimization_time, pg_stat_monitor_internal.jit_emission_count, pg_stat_monitor_internal.jit_emission_time FROM pg_stat_monitor_internal(true) pg_stat_monitor_internal(bucket, userid, username, dbid, datname, client_ip, queryid, planid, query, query_plan, pgsm_query_id, top_queryid, top_query, application_name, relations, cmd_type, elevel, sqlcode, message, bucket_start_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, resp_calls, cpu_user_time, cpu_sys_time, wal_records, wal_fpi, wal_bytes, comments, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since, toplevel, bucket_done) ORDER BY pg_stat_monitor_internal.bucket_start_time`,
);
__exportStar(require("./schema/prompt-queue"), exports);
exports.upscaleJobs = (0, pg_core_1.pgTable)("upscale_jobs", {
  id: (0, pg_core_1.text)().primaryKey().notNull(),
  status: (0, pg_core_1.text)().notNull().default("pending"),
  clipUrl: (0, pg_core_1.text)().notNull(),
  upscaledUrl: (0, pg_core_1.text)(),
  error: (0, pg_core_1.text)(),
  createdAt: (0, pg_core_1.timestamp)("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});
