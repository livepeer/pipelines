CREATE TYPE "public"."clip_status" AS ENUM('uploading', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "status" "clip_status" DEFAULT 'uploading' NOT NULL;