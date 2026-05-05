import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authId: uuid('auth_id').unique().notNull(),
  displayName: text('display_name'),
  hasSeenOnboarding: boolean('has_seen_onboarding').default(false).notNull(),
  pushToken: text('push_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

