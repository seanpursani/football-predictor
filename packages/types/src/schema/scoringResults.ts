import { pgTable, serial, integer, uuid, boolean, timestamp } from 'drizzle-orm/pg-core';
import { predictions } from './predictions';
import { users } from './users';
import { gameweeks } from './gameweeks';

export const scoringResults = pgTable('scoring_results', {
  id: serial('id').primaryKey(),
  predictionId: integer('prediction_id')
    .references(() => predictions.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  gameweekId: integer('gameweek_id')
    .references(() => gameweeks.id)
    .notNull(),
  eventPoints: integer('event_points').default(0).notNull(),
  timingBonus: integer('timing_bonus').default(0).notNull(),
  playerBonus: integer('player_bonus').default(0).notNull(),
  assisterBonus: integer('assister_bonus').default(0).notNull(),
  zoneBonus: integer('zone_bonus').default(0).notNull(),
  jackpotBonus: integer('jackpot_bonus').default(0).notNull(),
  captainMultiplier: integer('captain_multiplier').default(1).notNull(),
  streakBonus: integer('streak_bonus').default(0).notNull(),
  totalPoints: integer('total_points').default(0).notNull(),
  isCorrect: boolean('is_correct').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ScoringResult = typeof scoringResults.$inferSelect;
export type NewScoringResult = typeof scoringResults.$inferInsert;
export type LayerScore = ScoringResult;

