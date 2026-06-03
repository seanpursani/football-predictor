import React from 'react';
import { render } from '@testing-library/react-native';
import { RevealCard } from './RevealCard';

// ─── Mock expo-haptics ─────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────
const baseProps = {
  eventName: 'Goal',
  eventType: 'goal',
  predictionType: 'moment' as const,
  pointsValue: 420,
  isCaptain: false,
  firstView: true,
  reduceMotion: false,
};

function renderCard(overrides: Partial<typeof baseProps & { revealState: string; isStreakChained?: boolean; streakBonusPoints?: 10 | 20 | 30 | null }>) {
  return render(
    <RevealCard
      revealState={(overrides.revealState ?? 'pending') as any}
      {...baseProps}
      {...overrides}
    />,
  );
}

// ─── Snapshot tests: 6 states ─────────────────────────────────────────────
describe('RevealCard snapshots — firstView=true', () => {
  it('renders pending state', () => {
    const { toJSON } = renderCard({ revealState: 'pending' });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders revealing state', () => {
    const { toJSON } = renderCard({ revealState: 'revealing' });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders hit state', () => {
    const { toJSON } = renderCard({ revealState: 'hit' });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders miss state', () => {
    const { toJSON } = renderCard({ revealState: 'miss' });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders captain-hit state', () => {
    const { toJSON } = renderCard({ revealState: 'captain-hit', isCaptain: true });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders jackpot state', () => {
    const { toJSON } = renderCard({ revealState: 'jackpot' });
    expect(toJSON()).toMatchSnapshot();
  });
});

// ─── Snapshot tests: firstView=false (5 terminal + pending) ──────────────
describe('RevealCard snapshots — firstView=false (no animation)', () => {
  it('renders pending instantly with firstView=false', () => {
    const { toJSON } = renderCard({ revealState: 'pending', firstView: false });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders hit instantly with firstView=false', () => {
    const { toJSON } = renderCard({ revealState: 'hit', firstView: false });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders miss instantly with firstView=false', () => {
    const { toJSON } = renderCard({ revealState: 'miss', firstView: false });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders captain-hit instantly with firstView=false', () => {
    const { toJSON } = renderCard({ revealState: 'captain-hit', isCaptain: true, firstView: false });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders jackpot instantly with firstView=false', () => {
    const { toJSON } = renderCard({ revealState: 'jackpot', firstView: false });
    expect(toJSON()).toMatchSnapshot();
  });
});

// ─── Snapshot tests: reduceMotion=true ────────────────────────────────────
describe('RevealCard snapshots — reduceMotion=true', () => {
  it('renders hit with reduceMotion=true', () => {
    const { toJSON } = renderCard({ revealState: 'hit', reduceMotion: true });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders captain-hit with reduceMotion=true', () => {
    const { toJSON } = renderCard({ revealState: 'captain-hit', isCaptain: true, reduceMotion: true });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders jackpot with reduceMotion=true', () => {
    const { toJSON } = renderCard({ revealState: 'jackpot', reduceMotion: true });
    expect(toJSON()).toMatchSnapshot();
  });
});

// ─── Unit tests: haptics ──────────────────────────────────────────────────
describe('RevealCard haptics', () => {
  let Haptics: typeof import('expo-haptics');

  beforeEach(() => {
    Haptics = require('expo-haptics');
    jest.clearAllMocks();
  });

  it('fires Light haptic when transitioning to hit (firstView=true)', () => {
    renderCard({ revealState: 'hit', firstView: true });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('fires Medium haptic when transitioning to captain-hit (firstView=true)', () => {
    renderCard({ revealState: 'captain-hit', isCaptain: true, firstView: true });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
  });

  it('fires Success notification haptic when transitioning to jackpot (firstView=true)', () => {
    renderCard({ revealState: 'jackpot', firstView: true });
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('does NOT fire haptic for miss', () => {
    renderCard({ revealState: 'miss', firstView: true });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('does NOT fire haptic for pending', () => {
    renderCard({ revealState: 'pending', firstView: true });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('fires haptic for hit even when reduceMotion=true', () => {
    renderCard({ revealState: 'hit', firstView: true, reduceMotion: true });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('does NOT fire haptic when firstView=false (hit)', () => {
    renderCard({ revealState: 'hit', firstView: false });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('does NOT fire haptic when firstView=false (jackpot)', () => {
    renderCard({ revealState: 'jackpot', firstView: false });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});

// ─── Unit tests: no animation/haptic for firstView=false ─────────────────
describe('RevealCard firstView=false: no animation side-effects', () => {
  let Haptics: typeof import('expo-haptics');

  beforeEach(() => {
    Haptics = require('expo-haptics');
    jest.clearAllMocks();
  });

  it('renders captain-hit without haptic when firstView=false', () => {
    renderCard({ revealState: 'captain-hit', isCaptain: true, firstView: false });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('renders miss without haptic when firstView=false', () => {
    renderCard({ revealState: 'miss', firstView: false });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});

// ─── Unit tests: streak badge ─────────────────────────────────────────────
describe('RevealCard streak badge', () => {
  it('shows "+10" badge when streakBonusPoints=10 and isStreakChained=true', () => {
    const { getByText } = renderCard({
      revealState: 'hit',
      isStreakChained: true,
      streakBonusPoints: 10,
    });
    expect(getByText('+10')).toBeTruthy();
  });

  it('shows "+20" badge when streakBonusPoints=20 and isStreakChained=true', () => {
    const { getByText } = renderCard({
      revealState: 'hit',
      isStreakChained: true,
      streakBonusPoints: 20,
    });
    expect(getByText('+20')).toBeTruthy();
  });

  it('shows "+30" badge when streakBonusPoints=30 and isStreakChained=true', () => {
    const { getByText } = renderCard({
      revealState: 'hit',
      isStreakChained: true,
      streakBonusPoints: 30,
    });
    expect(getByText('+30')).toBeTruthy();
  });

  it('does NOT show streak badge when isStreakChained=false', () => {
    const { queryByText } = renderCard({
      revealState: 'hit',
      isStreakChained: false,
      streakBonusPoints: 10,
    });
    expect(queryByText('+10')).toBeNull();
  });

  it('does NOT show streak badge when streakBonusPoints=null', () => {
    const { queryByText } = renderCard({
      revealState: 'hit',
      isStreakChained: true,
      streakBonusPoints: null,
    });
    expect(queryByText(/^\+\d+$/)).toBeNull();
  });

  it('does NOT show streak badge when isStreakChained is undefined', () => {
    const { queryByText } = renderCard({
      revealState: 'hit',
      // isStreakChained not provided (undefined)
    });
    expect(queryByText(/^\+\d+$/)).toBeNull();
  });
});

// ─── Unit tests: onRevealComplete callback ────────────────────────────────
describe('RevealCard onRevealComplete', () => {
  it('calls onRevealComplete for hit with reduceMotion=true', () => {
    const onRevealComplete = jest.fn();
    renderCard({ revealState: 'hit', firstView: true, reduceMotion: true, onRevealComplete });
    expect(onRevealComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onRevealComplete for miss with reduceMotion=true', () => {
    const onRevealComplete = jest.fn();
    renderCard({ revealState: 'miss', firstView: true, reduceMotion: true, onRevealComplete });
    expect(onRevealComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onRevealComplete for captain-hit with reduceMotion=true', () => {
    const onRevealComplete = jest.fn();
    renderCard({ revealState: 'captain-hit', isCaptain: true, firstView: true, reduceMotion: true, onRevealComplete });
    expect(onRevealComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onRevealComplete for jackpot with reduceMotion=true', () => {
    const onRevealComplete = jest.fn();
    renderCard({ revealState: 'jackpot', firstView: true, reduceMotion: true, onRevealComplete });
    expect(onRevealComplete).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onRevealComplete when firstView=false', () => {
    const onRevealComplete = jest.fn();
    renderCard({ revealState: 'hit', firstView: false, onRevealComplete });
    expect(onRevealComplete).not.toHaveBeenCalled();
  });
});

