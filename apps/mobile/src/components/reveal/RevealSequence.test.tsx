import React from 'react';
import { act, render } from '@testing-library/react-native';
import { RevealSequence } from './RevealSequence';
import type { RevealSequenceProps } from './RevealSequence';
import type { ResultsRow } from '@/src/queries/useResultsQuery';
import type { Fixture, MiniLeague, LeaderboardEntry } from '@lecolpo/types';

// ─── Mock expo-haptics ─────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
}));

// ─── Mock useRevealStore ────────────────────────────────────────────────────
const mockAdvanceReveal = jest.fn();
const mockResetReveal = jest.fn();

let mockFirstView = true;
let mockReduceMotion = false;
let mockRevealIndex = 0;

jest.mock('@/src/stores/useRevealStore', () => ({
  useRevealStore: () => ({
    firstView: mockFirstView,
    reduceMotion: mockReduceMotion,
    revealIndex: mockRevealIndex,
    advanceReveal: mockAdvanceReveal,
    resetReveal: mockResetReveal,
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<ResultsRow> = {}): ResultsRow {
  return {
    id: Math.random(),
    predictionId: 1,
    userId: 'user-1',
    gameweekId: 1,
    eventPoints: 100,
    timingBonus: 0,
    playerBonus: 0,
    assisterBonus: 0,
    zoneBonus: 0,
    jackpotBonus: 0,
    captainMultiplier: 1,
    streakBonus: 0,
    totalPoints: 100,
    isCorrect: true,
    createdAt: '2026-01-01T00:00:00Z',
    predictionType: 'moment',
    isCaptain: false,
    fixtureId: 1,
    gameWeekMomentId: 1,
    predictedMinute: 45,
    eventName: 'Goal',
    eventType: 'goal',
    basePoints: 100,
    ...overrides,
  };
}

function makeMatchResult(overrides: Partial<ResultsRow> = {}): ResultsRow {
  return makeResult({ predictionType: 'match', predictedMinute: null, ...overrides });
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 1,
    gameweekId: 1,
    externalId: 'ext-1',
    homeTeam: 'Home',
    awayTeam: 'Away',
    kickoffAt: new Date('2026-01-01T15:00:00Z'),
    isPostponed: false,
    isVoid: false,
    eventsIngested: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

const defaultProps: RevealSequenceProps = {
  results: [],
  fixtures: [],
  leagues: [],
  leaderboardEntries: [],
  onAllRevealed: jest.fn(),
};

function renderSequence(props: Partial<RevealSequenceProps> = {}) {
  return render(<RevealSequence {...defaultProps} {...props} onAllRevealed={props.onAllRevealed ?? jest.fn()} />);
}

beforeEach(() => {
  mockFirstView = true;
  mockReduceMotion = false;
  mockRevealIndex = 0;
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── Snapshot tests ────────────────────────────────────────────────────────

describe('RevealSequence snapshots', () => {
  it('renders initial state (firstView=true, card 0 revealing, rest pending)', () => {
    const results = [makeResult({ id: 1 }), makeResult({ id: 2 })];
    const fixtures = [makeFixture()];
    const { toJSON } = renderSequence({ results, fixtures });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders firstView=false (all cards in final resolved state)', () => {
    mockFirstView = false;
    const results = [makeResult({ id: 1, isCorrect: true }), makeResult({ id: 2, isCorrect: false })];
    const fixtures = [makeFixture()];
    const { toJSON } = renderSequence({ results, fixtures });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders with reduceMotion=true (all cards final, no sequence)', () => {
    mockReduceMotion = true;
    const results = [makeResult({ id: 1 }), makeResult({ id: 2 })];
    const fixtures = [makeFixture()];
    const { toJSON } = renderSequence({ results, fixtures });
    expect(toJSON()).toMatchSnapshot();
  });
});

// ─── Unit tests: resetReveal on mount ─────────────────────────────────────

describe('RevealSequence: resetReveal', () => {
  it('calls resetReveal on mount when firstView=true', () => {
    mockFirstView = true;
    renderSequence();
    expect(mockResetReveal).toHaveBeenCalledTimes(1);
  });

  it('does NOT call resetReveal on mount when firstView=false', () => {
    mockFirstView = false;
    renderSequence();
    expect(mockResetReveal).not.toHaveBeenCalled();
  });
});

// ─── Unit tests: onAllRevealed callback ───────────────────────────────────

describe('RevealSequence: onAllRevealed', () => {
  it('fires onAllRevealed after all onRevealComplete callbacks (via reduceMotion=true)', () => {
    mockReduceMotion = true;
    const onAllRevealed = jest.fn();
    const results = [makeResult({ id: 1 }), makeResult({ id: 2 })];
    renderSequence({ results, onAllRevealed });
    // With reduceMotion=true, onAllRevealed is called immediately in the effect
    expect(onAllRevealed).toHaveBeenCalledTimes(1);
  });

  it('fires onAllRevealed when empty results (edge case)', () => {
    const onAllRevealed = jest.fn();
    renderSequence({ results: [], onAllRevealed });
    expect(onAllRevealed).toHaveBeenCalledTimes(1);
  });
});

// ─── Unit tests: running score counter ────────────────────────────────────

describe('RevealSequence: score counter', () => {
  it('displays final score after reduceMotion reveal', () => {
    mockReduceMotion = true;
    const results = [
      makeResult({ id: 1, totalPoints: 150 }),
      makeResult({ id: 2, totalPoints: 200 }),
    ];
    const { getAllByText } = renderSequence({ results });
    // Both the running score header and the summary section show the final score
    expect(getAllByText('350').length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Unit tests: sort order ────────────────────────────────────────────────

describe('RevealSequence: sort order (match picks before moment picks)', () => {
  it('renders match picks before moment picks', () => {
    mockReduceMotion = true;
    const fixture1 = makeFixture({ id: 1, kickoffAt: new Date('2026-01-01T15:00:00Z') });
    const matchResult = makeMatchResult({ id: 1, fixtureId: 1, eventName: 'Match Result', eventType: 'match_result' });
    const momentResult = makeResult({ id: 2, fixtureId: 1, eventName: 'Goal', eventType: 'goal' });
    const results = [momentResult, matchResult]; // moment first intentionally
    const { getByTestId } = renderSequence({ results, fixtures: [fixture1] });
    // card at index 0 (after sort) should be the match pick
    const card0 = getByTestId('reveal-card-0');
    const card1 = getByTestId('reveal-card-1');
    expect(card0.props.accessibilityLabel).toContain('Match Result');
    expect(card1.props.accessibilityLabel).toContain('Goal');
  });
});

// ─── Unit tests: isStreakChained ───────────────────────────────────────────

describe('RevealSequence: isStreakChained', () => {
  it('passes isStreakChained=true on cards with streakBonus > 0', () => {
    mockReduceMotion = true;
    const results = [makeResult({ id: 1, streakBonus: 10, totalPoints: 110 })];
    const { getByText } = renderSequence({ results, fixtures: [makeFixture()] });
    // Streak badge "+10" should be visible
    expect(getByText('+10')).toBeTruthy();
  });

  it('does NOT show streak badge when streakBonus=0', () => {
    mockReduceMotion = true;
    const results = [makeResult({ id: 1, streakBonus: 0 })];
    const { queryByText } = renderSequence({ results, fixtures: [makeFixture()] });
    expect(queryByText(/^\+\d+$/)).toBeNull();
  });
});

// ─── Unit tests: "No league yet" prompt ───────────────────────────────────

describe('RevealSequence: league prompt', () => {
  it('renders "No league yet" prompt when leagues prop is empty and results empty', () => {
    mockReduceMotion = false; // empty results path handles this
    const { getByTestId } = renderSequence({ leagues: [], results: [] });
    expect(getByTestId('no-league-prompt')).toBeTruthy();
  });

  it('renders "No league yet" prompt when leagues prop is empty with reduceMotion=true', () => {
    mockReduceMotion = true;
    const results = [makeResult({ id: 1 })];
    const { getByTestId } = renderSequence({ leagues: [], results, fixtures: [makeFixture()] });
    expect(getByTestId('no-league-prompt')).toBeTruthy();
  });

  it('does NOT render "No league yet" prompt when leagues has entries', () => {
    mockReduceMotion = true;
    const leagues: MiniLeague[] = [
      {
        id: 1,
        name: 'My League',
        inviteCode: 'ABC123',
        createdBy: 'user-1',
        createdAt: new Date('2026-01-01'),
      },
    ];
    const { queryByTestId } = renderSequence({ leagues, leaderboardEntries: [] });
    // leaderboardEntries is empty so no entry is shown, but no "no league" prompt either
    expect(queryByTestId('no-league-prompt')).toBeNull();
  });
});

// ─── Unit tests: chain connector ──────────────────────────────────────────

describe('RevealSequence: chain connector visible for consecutive correct moments', () => {
  it('renders chain connectors between consecutive correct moment picks', () => {
    mockReduceMotion = true;
    const results = [
      makeResult({ id: 1, isCorrect: true, predictionType: 'moment' }),
      makeResult({ id: 2, isCorrect: true, predictionType: 'moment' }),
    ];
    const { toJSON } = renderSequence({ results, fixtures: [makeFixture()] });
    // If there's a chain connector between them, the JSON will contain a narrow view
    expect(toJSON()).toMatchSnapshot();
  });
});

