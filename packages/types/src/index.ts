// Schema table exports
export * from './schema';

// Type exports
export type { User, NewUser } from './schema/users';
export type { Gameweek, NewGameweek, GameweekPhase } from './schema/gameweeks';
export type { Fixture, NewFixture } from './schema/fixtures';
export type { MomentType, GameweekMoment, MomentCard } from './schema/moments';
export type { Prediction, NewPrediction, PrecisionPick } from './schema/predictions';
export type { MatchEvent, NewMatchEvent } from './schema/matchEvents';
export type { ScoringResult, NewScoringResult, LayerScore } from './schema/scoringResults';
export type { LeaderboardEntry, NewLeaderboardEntry } from './schema/leaderboards';
export type { MiniLeague, LeagueMembership } from './schema/leagues';
export type { ScoringError, UserGameweekState } from './schema/admin';

// Alias for story AC compatibility
export type GameweekState = import('./schema/admin').UserGameweekState;

// Additional shared types
export type ConfidenceWindow = 5 | 10 | 15;
export type EventType = 'goal' | 'substitution' | 'corner' | 'yellow_card' | 'red_card' | 'match_result';
export type PredictionType = 'match' | 'moment';
