CREATE TYPE "public"."token_status" AS ENUM('PENDING', 'EXPIRED');--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "status" "token_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "expires_at" timestamp NOT NULL;