-- dev_moment_types.sql
-- Seed: moment_types catalogue for development
-- Story 3.4: Gameweek Lifecycle Scheduling & Development Seed Data
-- Idempotent: ON CONFLICT (name) DO NOTHING

INSERT INTO moment_types (name, event_type, prediction_type, description)
VALUES
  ('Goal Scored',              'goal',         'moment', 'Predict a player to score a goal'),
  ('Yellow Card',              'yellow_card',  'moment', 'Predict a player to receive a yellow card'),
  ('Red Card',                 'red_card',     'moment', 'Predict a player to receive a red card'),
  ('Substitution',             'substitution', 'moment', 'Predict a substitution player'),
  ('Corner Taken',             'corner',       'moment', 'Predict a corner event with zone'),
  ('Match Result - Home Win',  'match_result', 'match',  'Home team wins the match'),
  ('Match Result - Away Win',  'match_result', 'match',  'Away team wins the match'),
  ('Match Result - Draw',      'match_result', 'match',  'Match ends in a draw'),
  ('Both Teams to Score',      'btts',         'match',  'Both teams score at least one goal'),
  ('Over 2.5 Goals',           'over_goals',   'match',  'More than 2.5 goals in the match')
ON CONFLICT (name) DO NOTHING;

