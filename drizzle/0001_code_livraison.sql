ALTER TABLE "requests" ADD COLUMN "recipient_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "recipient_phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "delivery_code" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "code_attempts" integer DEFAULT 0 NOT NULL;