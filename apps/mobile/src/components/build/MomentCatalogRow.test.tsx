import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MomentCatalogRow } from './MomentCatalogRow';
import type { MomentType } from '@lecolpo/types';
import type { CatalogItem } from '@/src/queries/useCatalogQuery';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

const matchType: MomentType = {
  id: 1,
  name: 'Match Result',
  eventType: 'match_result',
  predictionType: 'match',
  description: null,
  createdAt: new Date(),
};

const momentType: MomentType = {
  id: 2,
  name: 'First Goalscorer',
  eventType: 'goal',
  predictionType: 'moment',
  description: null,
  createdAt: new Date(),
};

const baseItem: CatalogItem = {
  id: 10,
  gameweekId: 1,
  fixtureId: 5,
  momentTypeId: 1,
  basePoints: 350,
  playerBonusPoints: null,
  assisterBonusPoints: null,
  zoneBonusPoints: null,
  timingBonusPoints: null,
  jackpotBonusPoints: null,
  teamId: null,
  createdAt: new Date(),
  momentType: matchType,
};

describe('MomentCatalogRow', () => {
  it('match-type shows no arrow', () => {
    const { queryByText } = render(
      <MomentCatalogRow item={baseItem} momentType={matchType} isAdded={false} onTap={jest.fn()} />,
    );
    expect(queryByText('→')).toBeNull();
  });

  it('match-type shows flat integer points', () => {
    const { getByText } = render(
      <MomentCatalogRow item={baseItem} momentType={matchType} isAdded={false} onTap={jest.fn()} />,
    );
    expect(getByText('350')).toBeTruthy();
  });

  it('moment-type shows "→" arrow', () => {
    const momentItem = { ...baseItem, momentType: momentType };
    const { getByText } = render(
      <MomentCatalogRow item={momentItem} momentType={momentType} isAdded={false} onTap={jest.fn()} />,
    );
    expect(getByText('→')).toBeTruthy();
  });

  it('moment-type shows "420+" points', () => {
    const momentItem = { ...baseItem, basePoints: 420, momentType: momentType };
    const { getByText } = render(
      <MomentCatalogRow item={momentItem} momentType={momentType} isAdded={false} onTap={jest.fn()} />,
    );
    expect(getByText('420+')).toBeTruthy();
  });

  it('added state renders ✓', () => {
    const { getByText } = render(
      <MomentCatalogRow item={baseItem} momentType={matchType} isAdded={true} onTap={jest.fn()} />,
    );
    expect(getByText('✓')).toBeTruthy();
  });

  it('added state tap is no-op (onTap not called)', () => {
    const onTap = jest.fn();
    const { getByRole } = render(
      <MomentCatalogRow item={baseItem} momentType={matchType} isAdded={true} onTap={onTap} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onTap).not.toHaveBeenCalled();
  });

  it('unadded match-type tap fires onTap', () => {
    const onTap = jest.fn();
    const { getByRole } = render(
      <MomentCatalogRow item={baseItem} momentType={matchType} isAdded={false} onTap={onTap} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});

