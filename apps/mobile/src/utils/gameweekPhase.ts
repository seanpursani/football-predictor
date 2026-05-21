import type {Gameweek} from '@lecolpo/types';

export type GameweekPhase = 'building' | 'locked' | 'reveal';

export function deriveGameweekPhase(
    gameweek: Gameweek | null | undefined,
    hasSeenReveal: boolean,
    now: Date = new Date(),
): GameweekPhase | null {
    if (!gameweek) {
        return null;
    }

    // No kickoff yet or kickoff is in the future → building
    if (!gameweek.firstKickoff || now < gameweek.firstKickoff) {
        return 'building';
    }

    // Scoring complete and reveal not yet seen → reveal (overrides locked)
    if (gameweek.scoringStatus === 'complete' && !hasSeenReveal) {
        return 'reveal';
    }

    // All other cases: between kickoff and reveal (including error state)
    return 'locked';
}

export type DeriveGameweekPhase = typeof deriveGameweekPhase;

