import {deriveGameweekPhase} from './gameweekPhase';
import type {Gameweek} from '@lecolpo/types';

const BASE_KICKOFF = new Date('2026-05-10T15:00:00Z');

function makeGameweek(overrides: Partial<Gameweek> = {}): Gameweek {
    return {
        id: 1,
        gameweekNumber: 1,
        firstKickoff: BASE_KICKOFF,
        lastMatchEnd: new Date('2026-05-10T17:00:00Z'),
        scoringStatus: 'pending',
        status: 'building',
        season: '2025-26',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

describe('deriveGameweekPhase', () => {
    it('returns null when gameweek is null', () => {
        expect(deriveGameweekPhase(null, false, new Date())).toBeNull();
    });

    it('returns null when gameweek is undefined', () => {
        expect(deriveGameweekPhase(undefined, false, new Date())).toBeNull();
    });

    it('returns building when now < firstKickoff', () => {
        const now = new Date('2026-05-10T14:59:59Z');
        expect(deriveGameweekPhase(makeGameweek(), false, now)).toBe('building');
    });

    it('returns building when firstKickoff is null', () => {
        const gw = makeGameweek({firstKickoff: null});
        expect(deriveGameweekPhase(gw, false, new Date('2026-05-20T10:00:00Z'))).toBe('building');
    });

    it('returns locked when now === firstKickoff (exact boundary — first_kickoff ≤ now → locked)', () => {
        expect(deriveGameweekPhase(makeGameweek(), false, BASE_KICKOFF)).toBe('locked');
    });

    it('returns locked when now >= firstKickoff and scoring not complete, reveal not seen', () => {
        const now = new Date('2026-05-10T16:00:00Z');
        expect(deriveGameweekPhase(makeGameweek({scoringStatus: 'in_progress'}), false, now)).toBe('locked');
    });

    it('returns reveal when scoringStatus = complete and hasSeenReveal = false', () => {
        const now = new Date('2026-05-10T20:00:00Z');
        expect(deriveGameweekPhase(makeGameweek({scoringStatus: 'complete'}), false, now)).toBe('reveal');
    });

    it('returns locked when scoringStatus = complete and hasSeenReveal = true', () => {
        const now = new Date('2026-05-10T20:00:00Z');
        expect(deriveGameweekPhase(makeGameweek({scoringStatus: 'complete'}), true, now)).toBe('locked');
    });

    it('returns locked when scoringStatus = error (not reveal, not crash)', () => {
        const now = new Date('2026-05-10T20:00:00Z');
        expect(deriveGameweekPhase(makeGameweek({scoringStatus: 'error'}), false, now)).toBe('locked');
    });
});

