import { pgTable, serial, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { gameweeks } from './gameweeks';

export const fixtures = pgTable('fixtures', {
  id: serial('id').primaryKey(),
  gameweekId: integer('gameweek_id')
    .references(() => gameweeks.id)
    .notNull(),
  externalId: text('external_id').unique().notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  kickoffAt: timestamp('kickoff_at', { withTimezone: true }).notNull(),
  isPostponed: boolean('is_postponed').default(false).notNull(),
  isVoid: boolean('is_void').default(false).notNull(),
  eventsIngested: boolean('events_ingested').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Fixture = typeof fixtures.$inferSelect;
export type NewFixture = typeof fixtures.$inferInsert;

