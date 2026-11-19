CREATE TYPE "public"."parcel_status" AS ENUM('open', 'matched', 'closed');--> statement-breakpoint
CREATE TABLE "parcel_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"parcel_id" integer NOT NULL,
	"trip_id" integer NOT NULL,
	"gp_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"from_city" text NOT NULL,
	"to_city" text NOT NULL,
	"before_date" date,
	"weight_kg" integer NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "parcel_status" DEFAULT 'open' NOT NULL,
	"request_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"from_city" text,
	"to_city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parcel_offers" ADD CONSTRAINT "parcel_offers_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_offers" ADD CONSTRAINT "parcel_offers_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_offers" ADD CONSTRAINT "parcel_offers_gp_id_users_id_fk" FOREIGN KEY ("gp_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_alerts" ADD CONSTRAINT "trip_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "parcel_offers_unique_idx" ON "parcel_offers" USING btree ("parcel_id","trip_id");--> statement-breakpoint
CREATE INDEX "parcels_route_idx" ON "parcels" USING btree ("status","from_city","to_city");--> statement-breakpoint
CREATE INDEX "parcels_client_idx" ON "parcels" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "trip_alerts_user_idx" ON "trip_alerts" USING btree ("user_id");