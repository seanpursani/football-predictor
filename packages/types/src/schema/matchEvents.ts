import { pgTable, serial, integer, text, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { fixtures } from './fixtures';

export const matchEvents = pgTable(
  'match_events',
  {
    id: serial('id').primaryKey(),
    matchId: integer('match_id')
      .references(() => fixtures.id)
      .notNull(),
    eventType: text('event_type').notNull(),
    playerId: text('player_id').notNull(),
    minute: integer('minute').notNull(),
    teamId: text('team_id').notNull(),
    extraData: jsonb('extra_data'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_match_events_match_event_type').on(table.matchId, table.eventType),
  ],
);

export type MatchEvent = typeof matchEvents.$inferSelect;
export type NewMatchEvent = typeof matchEvents.$inferInsert;

