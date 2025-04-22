CREATE TYPE "public"."clip_approval_status" AS ENUM('none', 'pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "approval_status" "clip_approval_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;