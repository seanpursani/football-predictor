import React from 'react';
import { render } from '@testing-library/react-native';
import { GameweekHeader } from './GameweekHeader';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('GameweekHeader', () => {
  it('build phase shows "{used}/20" in lime colour', () => {
    const { getByText } = render(
      <GameweekHeader gameweekNumber={5} usedPicks={7} totalPicks={20} phase="building" />,
    );
    expect(getByText('GW 5')).toBeTruthy();
    const counter = getByText('7/20');
    expect(counter).toBeTruthy();
    const style = Array.isArray(counter.props.style)
      ? Object.assign({}, ...counter.props.style)
      : counter.props.style;
    expect(style).toMatchObject({ color: '#B4FF32' });
  });

  it('locked phase shows "Locked" badge', () => {
    const { getByText } = render(
      <GameweekHeader gameweekNumber={5} usedPicks={7} totalPicks={20} phase="locked" />,
    );
    expect(getByText('🔒 Locked')).toBeTruthy();
  });

  it('reveal phase shows "· Results" in title', () => {
    const { getByText } = render(
      <GameweekHeader gameweekNumber={5} usedPicks={7} totalPicks={20} phase="reveal" />,
    );
    expect(getByText('GW 5 · Results')).toBeTruthy();
  });
});

