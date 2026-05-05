import { pgTable, serial, integer, text, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const gameweeks = pgTable(
  'gameweeks',
  {
    id: serial('id').primaryKey(),
    gameweekNumber: integer('gameweek_number').unique().notNull(),
    firstKickoff: timestamp('first_kickoff', { withTimezone: true }),
    lastMatchEnd: timestamp('last_match_end', { withTimezone: true }),
    scoringStatus: text('scoring_status').default('pending').notNull(),
    status: text('status').notNull(),
    season: text('season').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'scoring_status_check',
      sql`${table.scoringStatus} IN ('pending', 'in_progress', 'complete', 'error')`,
    ),
    check(
      'status_check',
      sql`${table.status} IN ('building', 'locked', 'completed')`,
    ),
  ],
);

export type Gameweek = typeof gameweeks.$inferSelect;
export type NewGameweek = typeof gameweeks.$inferInsert;
export type GameweekPhase = 'building' | 'locked' | 'completed';

