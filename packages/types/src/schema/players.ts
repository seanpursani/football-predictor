import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { gameWeekMoments } from './moments';

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  teamId: text('team_id'),
  position: text('position'),
  externalId: text('external_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const gameWeekMomentPlayers = pgTable('game_week_moment_players', {
  id: serial('id').primaryKey(),
  gameWeekMomentId: integer('game_week_moment_id')
    .references(() => gameWeekMoments.id, { onDelete: 'cascade' })
    .notNull(),
  playerId: text('player_id')
    .references(() => players.id, { onDelete: 'cascade' })
    .notNull(),
  bonusPoints: integer('bonus_points').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type GameWeekMomentPlayer = typeof gameWeekMomentPlayers.$inferSelect;

