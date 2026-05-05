import { pgTable, serial, integer, uuid, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { gameweeks } from './gameweeks';

export const leaderboardEntries = pgTable(
  'leaderboard_entries',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    gameweekId: integer('gameweek_id').references(() => gameweeks.id),
    leaderboardType: text('leaderboard_type').notNull(),
    score: integer('score').default(0).notNull(),
    rank: integer('rank'),
    previousRank: integer('previous_rank'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_leaderboard_entries_type_gameweek').on(table.leaderboardType, table.gameweekId),
    check('leaderboard_type_check', sql`${table.leaderboardType} IN ('weekly', 'season')`),
  ],
);

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboardEntries.$inferInsert;

