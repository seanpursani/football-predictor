-- dev_fixtures.sql
-- Seed: 10 Premier League-style fixtures + game_week_moments for gameweek 1
-- Story 3.4: Gameweek Lifecycle Scheduling & Development Seed Data
--
-- base_points derived from ODDS_SCALE_FACTOR=40 formula (range: 30-120)
-- timing_bonus_points = 50, jackpot_bonus_points = 100 (from constants)
-- player_bonus_points, assister_bonus_points for goal moments
-- zone_bonus_points for corner moments
-- Idempotent: ON CONFLICT (external_id) DO NOTHING for fixtures
--
-- Requires: gameweek id=1 to exist (run dev_gameweek.sql first)
-- Requires: moment_types to exist (run dev_moment_types.sql first)

-- ============================================================
-- Fixtures
-- ============================================================
INSERT INTO fixtures (gameweek_id, external_id, home_team, away_team, kickoff_at, is_postponed, is_void,
                      events_ingested, created_at)
VALUES (1, 'ext-fix-001', 'Arsenal', 'Chelsea', (SELECT first_kickoff FROM gameweeks WHERE id = 1), false, false, false,
        NOW()),
       (1, 'ext-fix-002', 'Man City', 'Liverpool', (SELECT first_kickoff FROM gameweeks WHERE id = 1), false, false,
        false, NOW()),
       (1, 'ext-fix-003', 'Man Utd', 'Tottenham', (SELECT first_kickoff FROM gameweeks WHERE id = 1), false, false,
        false, NOW()),
       (1, 'ext-fix-004', 'Newcastle', 'Aston Villa',
        (SELECT first_kickoff FROM gameweeks WHERE id = 1) + INTERVAL '2 hours 30 minutes', false, false, false, NOW()),
       (1, 'ext-fix-005', 'Brighton', 'Brentford',
        (SELECT first_kickoff FROM gameweeks WHERE id = 1) + INTERVAL '2 hours 30 minutes', false, false, false, NOW()),
       (1, 'ext-fix-006', 'Fulham', 'Wolves',
        (SELECT first_kickoff FROM gameweeks WHERE id = 1) + INTERVAL '2 hours 30 minutes', false, false, false, NOW()),
       (1, 'ext-fix-007', 'Everton', 'Crystal Palace',
        (SELECT first_kickoff FROM gameweeks WHERE id = 1) + INTERVAL '2 hours 30 minutes', false, false, false, NOW()),
       (1, 'ext-fix-008', 'Nottm Forest', 'West Ham',
        (SELECT first_kickoff FROM gameweeks WHERE id = 1) + INTERVAL '5 hours', false, false, false, NOW()),
       (1, 'ext-fix-009', 'Bournemouth', 'Ipswich',
        (SELECT first_kickoff FROM gameweeks WHERE id = 1) + INTERVAL '5 hours', false, false, false, NOW()),
       (1, 'ext-fix-010', 'Leicester', 'Southampton',
        (SELECT first_kickoff FROM gameweeks WHERE id = 1) + INTERVAL '5 hours', false, false, false,
        NOW()) ON CONFLICT (external_id) DO NOTHING;

-- ============================================================
-- game_week_moments
-- One row per (fixture × moment_type), covering all 10 moment types.
-- Uses external_id lookup for fixture FK to avoid hardcoded serial IDs (F3 fix).
-- CASE expressions include ELSE 30 fallback to prevent NULL base_points (F4 fix).
-- Idempotent: NOT EXISTS guard on (fixture_id, moment_type_id).
-- ============================================================

-- ---- Fixture 1: Arsenal vs Chelsea ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 80
           WHEN 'yellow_card' THEN 40
           WHEN 'red_card' THEN 100
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 35
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 60
                                        WHEN 'Match Result - Away Win' THEN 70
                                        ELSE 80 END
           WHEN 'btts' THEN 55
           WHEN 'over_goals' THEN 60
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-001') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 2: Man City vs Liverpool ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 75
           WHEN 'yellow_card' THEN 38
           WHEN 'red_card' THEN 110
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 33
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 55
                                        WHEN 'Match Result - Away Win' THEN 65
                                        ELSE 90 END
           WHEN 'btts' THEN 50
           WHEN 'over_goals' THEN 55
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-002') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 3: Man Utd vs Tottenham ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 65
           WHEN 'yellow_card' THEN 42
           WHEN 'red_card' THEN 105
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 36
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 70
                                        WHEN 'Match Result - Away Win' THEN 65
                                        ELSE 75 END
           WHEN 'btts' THEN 52
           WHEN 'over_goals' THEN 58
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-003') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 4: Newcastle vs Aston Villa ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 60
           WHEN 'yellow_card' THEN 40
           WHEN 'red_card' THEN 100
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 34
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 58
                                        WHEN 'Match Result - Away Win' THEN 72
                                        ELSE 80 END
           WHEN 'btts' THEN 50
           WHEN 'over_goals' THEN 55
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-004') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 5: Brighton vs Brentford ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 55
           WHEN 'yellow_card' THEN 38
           WHEN 'red_card' THEN 95
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 32
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 55
                                        WHEN 'Match Result - Away Win' THEN 75
                                        ELSE 82 END
           WHEN 'btts' THEN 48
           WHEN 'over_goals' THEN 50
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-005') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 6: Fulham vs Wolves ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 50
           WHEN 'yellow_card' THEN 40
           WHEN 'red_card' THEN 95
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 32
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 60
                                        WHEN 'Match Result - Away Win' THEN 70
                                        ELSE 80 END
           WHEN 'btts' THEN 48
           WHEN 'over_goals' THEN 50
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-006') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 7: Everton vs Crystal Palace ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 48
           WHEN 'yellow_card' THEN 42
           WHEN 'red_card' THEN 90
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 30
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 65
                                        WHEN 'Match Result - Away Win' THEN 68
                                        ELSE 78 END
           WHEN 'btts' THEN 46
           WHEN 'over_goals' THEN 48
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-007') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 8: Nottm Forest vs West Ham ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 52
           WHEN 'yellow_card' THEN 40
           WHEN 'red_card' THEN 92
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 31
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 62
                                        WHEN 'Match Result - Away Win' THEN 72
                                        ELSE 76 END
           WHEN 'btts' THEN 47
           WHEN 'over_goals' THEN 51
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-008') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 9: Bournemouth vs Ipswich ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 45
           WHEN 'yellow_card' THEN 38
           WHEN 'red_card' THEN 88
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 30
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 52
                                        WHEN 'Match Result - Away Win' THEN 80
                                        ELSE 85 END
           WHEN 'btts' THEN 44
           WHEN 'over_goals' THEN 46
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-009') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

-- ---- Fixture 10: Leicester vs Southampton ----
INSERT INTO game_week_moments (gameweek_id, fixture_id, moment_type_id, base_points, player_bonus_points,
                               assister_bonus_points, zone_bonus_points, timing_bonus_points, jackpot_bonus_points,
                               team_id, created_at)
SELECT 1,
       f.id,
       mt.id,
       CASE mt.event_type
           WHEN 'goal' THEN 42
           WHEN 'yellow_card' THEN 36
           WHEN 'red_card' THEN 85
           WHEN 'substitution' THEN 30
           WHEN 'corner' THEN 30
           WHEN 'match_result' THEN CASE mt.name
                                        WHEN 'Match Result - Home Win' THEN 50
                                        WHEN 'Match Result - Away Win' THEN 85
                                        ELSE 88 END
           WHEN 'btts' THEN 42
           WHEN 'over_goals' THEN 44
           ELSE 30
           END,
       CASE WHEN mt.event_type IN ('goal', 'substitution') THEN 20 ELSE NULL END,
       CASE WHEN mt.event_type = 'goal' THEN 15 ELSE NULL END,
       CASE WHEN mt.event_type = 'corner' THEN 10 ELSE NULL END,
       50,
       100,
       NULL,
       NOW()
FROM moment_types mt
         CROSS JOIN (SELECT id FROM fixtures WHERE external_id = 'ext-fix-010') f
WHERE NOT EXISTS (SELECT 1 FROM game_week_moments gwm WHERE gwm.fixture_id = f.id AND gwm.moment_type_id = mt.id);

