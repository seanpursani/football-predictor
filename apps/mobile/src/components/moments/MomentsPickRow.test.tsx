import React from 'react';
import { render } from '@testing-library/react-native';
import { MomentsPickRow } from './MomentsPickRow';
import type { Prediction } from '@lecolpo/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

const basePick: Prediction = {
  id: 1,
  userId: 'u1',
  gameweekId: 1,
  fixtureId: 10,
  gameWeekMomentId: 100,
  predictionType: 'match',
  isCaptain: false,
  predictedMinute: null,
  confidenceWindow: null,
  predictedPlayerId: null,
  predictedAssisterId: null,
  predictedZone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MomentsPickRow', () => {
  it('renders event name and TypeBadge', () => {
    const { getByText } = render(
      <MomentsPickRow
        pick={basePick}
        fixtureLabel="Arsenal vs Chelsea"
        eventName="Match Result"
        eventType="match_result"
        predictionType="match"
        isCaptain={false}
        basePoints={350}
      />,
    );
    expect(getByText('Match Result')).toBeTruthy();
    expect(getByText('MATCH')).toBeTruthy();
  });

  it('captain crown shown when isCaptain=true', () => {
    const { getByText } = render(
      <MomentsPickRow
        pick={basePick}
        fixtureLabel="Arsenal vs Chelsea"
        eventName="Match Result"
        eventType="match_result"
        predictionType="match"
        isCaptain={true}
        basePoints={350}
      />,
    );
    expect(getByText('👑')).toBeTruthy();
  });

  it('no crown when isCaptain=false', () => {
    const { queryByText } = render(
      <MomentsPickRow
        pick={basePick}
        fixtureLabel="Arsenal vs Chelsea"
        eventName="Match Result"
        eventType="match_result"
        predictionType="match"
        isCaptain={false}
        basePoints={350}
      />,
    );
    expect(queryByText('👑')).toBeNull();
  });

  it('has accessibilityRole="text"', () => {
    const { UNSAFE_getAllByProps } = render(
      <MomentsPickRow
        pick={basePick}
        fixtureLabel="Arsenal vs Chelsea"
        eventName="Match Result"
        eventType="match_result"
        predictionType="match"
        isCaptain={false}
        basePoints={350}
      />,
    );
    const elements = UNSAFE_getAllByProps({ accessibilityRole: 'text' });
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows "min N" suffix for moment pick with predictedMinute', () => {
    const { getByText } = render(
      <MomentsPickRow
        pick={{ ...basePick, predictionType: 'moment', predictedMinute: 23 }}
        fixtureLabel="Arsenal vs Chelsea"
        eventName="First Goalscorer"
        eventType="goal"
        predictionType="moment"
        isCaptain={false}
        basePoints={420}
        predictedMinute={23}
      />,
    );
    expect(getByText('First Goalscorer · min 23')).toBeTruthy();
  });
});

