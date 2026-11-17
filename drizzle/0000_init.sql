CREATE TYPE "public"."document_status" AS ENUM('pending', 'approved', 'refused');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('new', 'in_progress', 'closed');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'accepted', 'refused', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('client', 'gp', 'admin');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('active', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('none', 'pending', 'verified', 'refused');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer NOT NULL,
	"type" text NOT NULL,
	"trip_id" integer,
	"request_id" integer,
	"target_user_id" integer,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"status" "report_status" DEFAULT 'new' NOT NULL,
	"admin_reply" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"weight_kg" integer NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_per_kg" integer NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"gp_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"gp_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"stars" smallint NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"gp_id" integer NOT NULL,
	"from_city" text NOT NULL,
	"to_city" text NOT NULL,
	"departure_date" date NOT NULL,
	"capacity_kg" integer NOT NULL,
	"price_per_kg" integer NOT NULL,
	"delivery_days" integer NOT NULL,
	"forbidden_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "trip_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'client' NOT NULL,
	"verification" "verification_status" DEFAULT 'none' NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_docs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"file_path" text,
	"mime_type" text NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_gp_id_users_id_fk" FOREIGN KEY ("gp_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_gp_id_users_id_fk" FOREIGN KEY ("gp_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_docs" ADD CONSTRAINT "verification_docs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_request_idx" ON "messages" USING btree ("request_id","id");--> statement-breakpoint
CREATE INDEX "requests_trip_idx" ON "requests" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "requests_client_idx" ON "requests" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_request_idx" ON "reviews" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "reviews_gp_idx" ON "reviews" USING btree ("gp_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_search_idx" ON "trips" USING btree ("from_city","to_city","departure_date");--> statement-breakpoint
CREATE INDEX "trips_gp_idx" ON "trips" USING btree ("gp_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");