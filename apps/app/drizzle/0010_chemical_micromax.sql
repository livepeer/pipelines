ALTER TABLE "prompt_state" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "prompt_queue" ADD COLUMN "stream_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prompt_state" ADD COLUMN "stream_key" text NOT NULL;--> statement-breakpoint
CREATE INDEX "prompt_queue_stream_key_idx" ON "prompt_queue" USING btree ("stream_key");