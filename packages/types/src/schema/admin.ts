import { pgTable, serial, integer, uuid, text, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { gameweeks } from './gameweeks';
import { users } from './users';

export const scoringErrors = pgTable('scoring_errors', {
  id: serial('id').primaryKey(),
  gameweekId: integer('gameweek_id')
    .references(() => gameweeks.id)
    .notNull(),
  errorCode: text('error_code').notNull(),
  errorMessage: text('error_message').notNull(),
  context: jsonb('context'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userGameweekStates = pgTable(
  'user_gameweek_states',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    gameweekId: integer('gameweek_id')
      .references(() => gameweeks.id)
      .notNull(),
    hasSeenReveal: boolean('has_seen_reveal').default(false).notNull(),
    boldnessScore: integer('boldness_score'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('user_gameweek_states_user_gameweek_unique').on(table.userId, table.gameweekId),
  ],
);

export type ScoringError = typeof scoringErrors.$inferSelect;
export type UserGameweekState = typeof userGameweekStates.$inferSelect;

