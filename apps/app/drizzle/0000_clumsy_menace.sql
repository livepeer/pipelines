-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."validation_status" AS ENUM('valid', 'invalid', 'processing', 'pending');--> statement-breakpoint
CREATE TABLE "shared_params" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"params" jsonb,
	"author" text,
	"pipeline" text,
	"hash" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"last_login" timestamp,
	"is_active" boolean DEFAULT true,
	"provider" varchar(50),
	"additional_details" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_provider_check" CHECK ((provider)::text = ANY (ARRAY[('discord'::character varying)::text, ('email'::character varying)::text, ('github'::character varying)::text, ('google'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"last_used" timestamp,
	"name" varchar(255),
	"description" text,
	"is_private" boolean DEFAULT true,
	"cover_image" varchar(255),
	"type" varchar(50) DEFAULT 'comfyUI',
	"sample_code_repo" varchar(255),
	"is_featured" boolean DEFAULT false,
	"sample_input_video" varchar(255),
	"author" text,
	"model_card" jsonb DEFAULT '{}'::jsonb,
	"key" text,
	"config" jsonb,
	"comfy_ui_json" jsonb,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"validation_status" "validation_status" DEFAULT 'pending' NOT NULL,
	"prioritized_params" jsonb
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"api_key" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"last_used" timestamp,
	"is_active" boolean DEFAULT true,
	"name" varchar,
	CONSTRAINT "api_keys_api_key_key" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"job_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"pipeline_details" json NOT NULL,
	"duration_s" integer NOT NULL,
	"credit_cost" numeric(10, 2) NOT NULL,
	"eth_fees" numeric(10, 2),
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "jobs_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'in-progress'::character varying, 'completed'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"purchase_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"credits_purchased" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"change_amount" numeric(10, 2) NOT NULL,
	"reason" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" text PRIMARY KEY NOT NULL,
	"stream_key" text NOT NULL,
	"output_stream_url" text NOT NULL,
	"pipeline_params" jsonb,
	"created_at" timestamp DEFAULT now(),
	"pipeline_id" text,
	"output_playback_id" text,
	"name" text,
	"author" text,
	"from_playground" boolean DEFAULT true,
	"gateway_host" text DEFAULT '',
	"is_smoke_test" boolean DEFAULT false,
	"whip_url" varchar
);
--> statement-breakpoint
ALTER TABLE "shared_params" ADD CONSTRAINT "shared_params_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "shared_params" ADD CONSTRAINT "shared_params_pipeline_fkey" FOREIGN KEY ("pipeline") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."pg_stat_monitor" AS (SELECT pg_stat_monitor_internal.bucket, pg_stat_monitor_internal.bucket_start_time, pg_stat_monitor_internal.userid, pg_stat_monitor_internal.username, pg_stat_monitor_internal.dbid, pg_stat_monitor_internal.datname, '0.0.0.0'::inet + pg_stat_monitor_internal.client_ip AS client_ip, pg_stat_monitor_internal.pgsm_query_id, pg_stat_monitor_internal.queryid, pg_stat_monitor_internal.toplevel, pg_stat_monitor_internal.top_queryid, pg_stat_monitor_internal.query, pg_stat_monitor_internal.comments, pg_stat_monitor_internal.planid, pg_stat_monitor_internal.query_plan, pg_stat_monitor_internal.top_query, pg_stat_monitor_internal.application_name, string_to_array(pg_stat_monitor_internal.relations, ','::text) AS relations, pg_stat_monitor_internal.cmd_type, get_cmd_type(pg_stat_monitor_internal.cmd_type) AS cmd_type_text, pg_stat_monitor_internal.elevel, pg_stat_monitor_internal.sqlcode, pg_stat_monitor_internal.message, pg_stat_monitor_internal.calls, pg_stat_monitor_internal.total_exec_time, pg_stat_monitor_internal.min_exec_time, pg_stat_monitor_internal.max_exec_time, pg_stat_monitor_internal.mean_exec_time, pg_stat_monitor_internal.stddev_exec_time, pg_stat_monitor_internal.rows, pg_stat_monitor_internal.shared_blks_hit, pg_stat_monitor_internal.shared_blks_read, pg_stat_monitor_internal.shared_blks_dirtied, pg_stat_monitor_internal.shared_blks_written, pg_stat_monitor_internal.local_blks_hit, pg_stat_monitor_internal.local_blks_read, pg_stat_monitor_internal.local_blks_dirtied, pg_stat_monitor_internal.local_blks_written, pg_stat_monitor_internal.temp_blks_read, pg_stat_monitor_internal.temp_blks_written, pg_stat_monitor_internal.shared_blk_read_time AS blk_read_time, pg_stat_monitor_internal.shared_blk_write_time AS blk_write_time, pg_stat_monitor_internal.temp_blk_read_time, pg_stat_monitor_internal.temp_blk_write_time, string_to_array(pg_stat_monitor_internal.resp_calls, ','::text) AS resp_calls, pg_stat_monitor_internal.cpu_user_time, pg_stat_monitor_internal.cpu_sys_time, pg_stat_monitor_internal.wal_records, pg_stat_monitor_internal.wal_fpi, pg_stat_monitor_internal.wal_bytes, pg_stat_monitor_internal.bucket_done, pg_stat_monitor_internal.plans, pg_stat_monitor_internal.total_plan_time, pg_stat_monitor_internal.min_plan_time, pg_stat_monitor_internal.max_plan_time, pg_stat_monitor_internal.mean_plan_time, pg_stat_monitor_internal.stddev_plan_time, pg_stat_monitor_internal.jit_functions, pg_stat_monitor_internal.jit_generation_time, pg_stat_monitor_internal.jit_inlining_count, pg_stat_monitor_internal.jit_inlining_time, pg_stat_monitor_internal.jit_optimization_count, pg_stat_monitor_internal.jit_optimization_time, pg_stat_monitor_internal.jit_emission_count, pg_stat_monitor_internal.jit_emission_time FROM pg_stat_monitor_internal(true) pg_stat_monitor_internal(bucket, userid, username, dbid, datname, client_ip, queryid, planid, query, query_plan, pgsm_query_id, top_queryid, top_query, application_name, relations, cmd_type, elevel, sqlcode, message, bucket_start_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, resp_calls, cpu_user_time, cpu_sys_time, wal_records, wal_fpi, wal_bytes, comments, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since, toplevel, bucket_done) ORDER BY pg_stat_monitor_internal.bucket_start_time);
*/