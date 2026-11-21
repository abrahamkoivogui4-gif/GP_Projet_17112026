CREATE TABLE "site_visits" (
	"day" date NOT NULL,
	"visitor" text NOT NULL,
	"views" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "site_visits_day_visitor" ON "site_visits" USING btree ("day","visitor");