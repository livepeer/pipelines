CREATE TABLE IF NOT EXISTS "upscale_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'processing',
  "clipUrl" text NOT NULL,
  "upscaledUrl" text,
  "error" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "upscale_jobs_status_check" CHECK (status::text = ANY (ARRAY['processing'::character varying, 'completed'::character varying, 'failed'::character varying]::text[]))
); 