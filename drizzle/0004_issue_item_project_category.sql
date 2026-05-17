ALTER TABLE "issue_items" ADD COLUMN IF NOT EXISTS "project" text;
--> statement-breakpoint
ALTER TABLE "issue_items" ADD COLUMN IF NOT EXISTS "category" text;
