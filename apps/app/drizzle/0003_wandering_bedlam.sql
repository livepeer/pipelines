ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_api_key_key";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_key";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "last_used" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "name" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "cover_image" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "type" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "sample_code_repo" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "sample_input_video" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "pipelines" ALTER COLUMN "comfy_ui_json" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "streams" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_login" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "provider" SET DATA TYPE varchar;