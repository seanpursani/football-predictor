CREATE TABLE "scoring_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameweek_id" integer NOT NULL,
	"error_code" text NOT NULL,
	"error_message" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_gameweek_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"gameweek_id" integer NOT NULL,
	"has_seen_reveal" boolean DEFAULT false NOT NULL,
	"boldness_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_gameweek_states_user_gameweek_unique" UNIQUE("user_id","gameweek_id")
);
--> statement-breakpoint
CREATE TABLE "fixtures" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameweek_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"kickoff_at" timestamp with time zone NOT NULL,
	"is_postponed" boolean DEFAULT false NOT NULL,
	"is_void" boolean DEFAULT false NOT NULL,
	"events_ingested" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fixtures_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "gameweeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameweek_number" integer NOT NULL,
	"first_kickoff" timestamp with time zone,
	"last_match_end" timestamp with time zone,
	"scoring_status" text DEFAULT 'pending' NOT NULL,
	"status" text NOT NULL,
	"season" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gameweeks_gameweek_number_unique" UNIQUE("gameweek_number"),
	CONSTRAINT "scoring_status_check" CHECK ("gameweeks"."scoring_status" IN ('pending', 'in_progress', 'complete', 'error')),
	CONSTRAINT "status_check" CHECK ("gameweeks"."status" IN ('building', 'locked', 'completed'))
);
--> statement-breakpoint
CREATE TABLE "game_week_moments" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameweek_id" integer NOT NULL,
	"fixture_id" integer NOT NULL,
	"moment_type_id" integer NOT NULL,
	"base_points" integer NOT NULL,
	"player_bonus_points" integer,
	"assister_bonus_points" integer,
	"zone_bonus_points" integer,
	"timing_bonus_points" integer,
	"jackpot_bonus_points" integer,
	"team_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"gameweek_id" integer,
	"leaderboard_type" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"previous_rank" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_type_check" CHECK ("leaderboard_entries"."leaderboard_type" IN ('weekly', 'season'))
);
--> statement-breakpoint
CREATE TABLE "league_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_memberships_league_user_unique" UNIQUE("league_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "match_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"player_id" text NOT NULL,
	"minute" integer NOT NULL,
	"team_id" text NOT NULL,
	"extra_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mini_leagues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mini_leagues_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "moment_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"event_type" text NOT NULL,
	"prediction_type" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moment_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"gameweek_id" integer NOT NULL,
	"fixture_id" integer NOT NULL,
	"game_week_moment_id" integer NOT NULL,
	"prediction_type" text NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"predicted_minute" integer,
	"confidence_window" integer,
	"predicted_player_id" text,
	"predicted_assister_id" text,
	"predicted_zone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "predictions_user_gameweek_moment_unique" UNIQUE("user_id","gameweek_id","game_week_moment_id")
);
--> statement-breakpoint
CREATE TABLE "scoring_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"prediction_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"gameweek_id" integer NOT NULL,
	"event_points" integer DEFAULT 0 NOT NULL,
	"timing_bonus" integer DEFAULT 0 NOT NULL,
	"player_bonus" integer DEFAULT 0 NOT NULL,
	"assister_bonus" integer DEFAULT 0 NOT NULL,
	"zone_bonus" integer DEFAULT 0 NOT NULL,
	"jackpot_bonus" integer DEFAULT 0 NOT NULL,
	"captain_multiplier" integer DEFAULT 1 NOT NULL,
	"streak_bonus" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" uuid NOT NULL,
	"display_name" text,
	"has_seen_onboarding" boolean DEFAULT false NOT NULL,
	"push_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
ALTER TABLE "scoring_errors" ADD CONSTRAINT "scoring_errors_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gameweek_states" ADD CONSTRAINT "user_gameweek_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gameweek_states" ADD CONSTRAINT "user_gameweek_states_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_week_moments" ADD CONSTRAINT "game_week_moments_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_week_moments" ADD CONSTRAINT "game_week_moments_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_week_moments" ADD CONSTRAINT "game_week_moments_moment_type_id_moment_types_id_fk" FOREIGN KEY ("moment_type_id") REFERENCES "public"."moment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_league_id_mini_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."mini_leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_fixtures_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."fixtures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mini_leagues" ADD CONSTRAINT "mini_leagues_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_game_week_moment_id_game_week_moments_id_fk" FOREIGN KEY ("game_week_moment_id") REFERENCES "public"."game_week_moments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_results" ADD CONSTRAINT "scoring_results_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_results" ADD CONSTRAINT "scoring_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_results" ADD CONSTRAINT "scoring_results_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_leaderboard_entries_type_gameweek" ON "leaderboard_entries" USING btree ("leaderboard_type","gameweek_id");--> statement-breakpoint
CREATE INDEX "idx_match_events_match_event_type" ON "match_events" USING btree ("match_id","event_type");--> statement-breakpoint

-- 20-prediction limit trigger (cannot be expressed as CHECK constraint)
CREATE OR REPLACE FUNCTION check_prediction_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM predictions
    WHERE user_id = NEW.user_id AND gameweek_id = NEW.gameweek_id
  ) >= 20 THEN
    RAISE EXCEPTION 'Maximum 20 predictions per gameweek reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_prediction_limit
  BEFORE INSERT ON predictions
  FOR EACH ROW EXECUTE FUNCTION check_prediction_limit();
