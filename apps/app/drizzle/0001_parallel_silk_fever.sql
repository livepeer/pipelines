CREATE TABLE "clip_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"clip_id" integer NOT NULL,
	"viewer_user_id" text,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"session_id" text,
	"duration_watched_ms" integer
);
--> statement-breakpoint
CREATE TABLE "clips" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"author_user_id" text NOT NULL,
	"source_clip_id" integer,
	"prompt" text NOT NULL,
	"priority" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clip_views" ADD CONSTRAINT "clip_views_clip_id_fkey" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "clip_views" ADD CONSTRAINT "clip_views_viewer_user_id_fkey" FOREIGN KEY ("viewer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_source_clip_id_fkey" FOREIGN KEY ("source_clip_id") REFERENCES "public"."clips"("id") ON DELETE set null ON UPDATE cascade;