CREATE TABLE IF NOT EXISTS "identity_records" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"birth_date" date,
	"doc_type" text NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"doc_number" text DEFAULT '' NOT NULL,
	"expires_on" date,
	"note" text DEFAULT '' NOT NULL,
	"checked_by" integer,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity_records" ADD CONSTRAINT "identity_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_records" ADD CONSTRAINT "identity_records_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
