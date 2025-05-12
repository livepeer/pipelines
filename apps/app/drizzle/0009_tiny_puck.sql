CREATE TABLE "prompt_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"seed" text NOT NULL,
	"is_user" boolean DEFAULT false NOT NULL,
	"session_id" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"position" integer NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prompt_state" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"displayed_prompts" json NOT NULL,
	"prompt_avatar_seeds" json NOT NULL,
	"user_prompt_indices" json NOT NULL,
	"prompt_session_ids" json NOT NULL,
	"highlighted_since" timestamp with time zone DEFAULT now() NOT NULL,
	"is_processing" boolean DEFAULT false NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "prompt_queue_position_idx" ON "prompt_queue" USING btree ("position");--> statement-breakpoint
CREATE INDEX "prompt_queue_processed_idx" ON "prompt_queue" USING btree ("processed");