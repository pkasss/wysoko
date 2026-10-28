CREATE TABLE "boulder" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boulder_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"number" integer NOT NULL,
	"grade" integer NOT NULL,
	"competition_id" integer NOT NULL,
	CONSTRAINT "boulder_number_competition_id_unique" UNIQUE("number","competition_id")
);
--> statement-breakpoint
CREATE TABLE "competition" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "competition_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"zoneMultiplier" integer NOT NULL,
	"topMultiplier" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "competitor_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token" varchar NOT NULL UNIQUE,
	"user_id" text NOT NULL,
	"competition_id" integer NOT NULL,
	CONSTRAINT "competitor_user_id_competition_id_unique" UNIQUE("user_id","competition_id")
);
--> statement-breakpoint
CREATE TABLE "result" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "result_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"competitor_id" integer NOT NULL,
	"boulder_id" integer NOT NULL,
	"isZone" boolean DEFAULT false NOT NULL,
	"isTop" boolean DEFAULT false NOT NULL,
	CONSTRAINT "result_competitor_id_boulder_id_unique" UNIQUE("competitor_id","boulder_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text UNIQUE,
	"display_username" text
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "boulder" ADD CONSTRAINT "boulder_competition_id_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id");--> statement-breakpoint
ALTER TABLE "competitor" ADD CONSTRAINT "competitor_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "competitor" ADD CONSTRAINT "competitor_competition_id_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id");--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_competitor_id_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitor"("id");--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_boulder_id_boulder_id_fkey" FOREIGN KEY ("boulder_id") REFERENCES "boulder"("id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;