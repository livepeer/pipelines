CREATE TABLE "clip_slugs" (
	"slug" text PRIMARY KEY NOT NULL,
	"clip_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clip_slugs" ADD CONSTRAINT "clip_slugs_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE cascade;