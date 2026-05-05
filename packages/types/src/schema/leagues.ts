import { pgTable, serial, integer, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const miniLeagues = pgTable('mini_leagues', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').unique().notNull(),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const leagueMemberships = pgTable(
  'league_memberships',
  {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
      .references(() => miniLeagues.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('league_memberships_league_user_unique').on(table.leagueId, table.userId),
  ],
);

export type MiniLeague = typeof miniLeagues.$inferSelect;
export type LeagueMembership = typeof leagueMemberships.$inferSelect;

