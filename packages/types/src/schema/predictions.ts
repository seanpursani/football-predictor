import {
  pgTable,
  serial,
  integer,
  uuid,
  text,
  boolean,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { gameweeks } from './gameweeks';
import { fixtures } from './fixtures';
import { gameWeekMoments } from './moments';

export const predictions = pgTable(
  'predictions',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    gameweekId: integer('gameweek_id')
      .references(() => gameweeks.id)
      .notNull(),
    fixtureId: integer('fixture_id')
      .references(() => fixtures.id)
      .notNull(),
    gameWeekMomentId: integer('game_week_moment_id')
      .references(() => gameWeekMoments.id)
      .notNull(),
    predictionType: text('prediction_type').notNull(),
    isCaptain: boolean('is_captain').default(false).notNull(),
    predictedMinute: integer('predicted_minute'),
    confidenceWindow: integer('confidence_window'),
    predictedPlayerId: text('predicted_player_id'),
    predictedAssisterId: text('predicted_assister_id'),
    predictedZone: text('predicted_zone'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('predictions_user_gameweek_moment_unique').on(
      table.userId,
      table.gameweekId,
      table.gameWeekMomentId,
    ),
  ],
);

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;
export type PrecisionPick = Prediction;

