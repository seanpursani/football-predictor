import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { gameweeks } from './gameweeks';
import { fixtures } from './fixtures';

export const momentTypes = pgTable('moment_types', {
  id: serial('id').primaryKey(),
  name: text('name').unique().notNull(),
  eventType: text('event_type').notNull(),
  predictionType: text('prediction_type').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const gameWeekMoments = pgTable('game_week_moments', {
  id: serial('id').primaryKey(),
  gameweekId: integer('gameweek_id')
    .references(() => gameweeks.id)
    .notNull(),
  fixtureId: integer('fixture_id')
    .references(() => fixtures.id)
    .notNull(),
  momentTypeId: integer('moment_type_id')
    .references(() => momentTypes.id)
    .notNull(),
  basePoints: integer('base_points').notNull(),
  playerBonusPoints: integer('player_bonus_points'),
  assisterBonusPoints: integer('assister_bonus_points'),
  zoneBonusPoints: integer('zone_bonus_points'),
  timingBonusPoints: integer('timing_bonus_points'),
  jackpotBonusPoints: integer('jackpot_bonus_points'),
  teamId: text('team_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type MomentType = typeof momentTypes.$inferSelect;
export type GameweekMoment = typeof gameWeekMoments.$inferSelect;
export type MomentCard = GameweekMoment;

