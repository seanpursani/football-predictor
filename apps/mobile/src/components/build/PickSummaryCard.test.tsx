import React from 'react';
import { render } from '@testing-library/react-native';
import { PickSummaryCard } from './PickSummaryCard';

describe('PickSummaryCard', () => {
  it('calculates total = basePoints + playerBonus + zoneBonus', () => {
    const { getByText } = render(
      <PickSummaryCard basePoints={200} playerBonus={100} zoneBonus={50} />,
    );
    expect(getByText('350 pts')).toBeTruthy();
  });

  it('updates total when zoneBonus changes (re-render with new prop)', () => {
    const { getByText, rerender } = render(
      <PickSummaryCard basePoints={200} playerBonus={100} zoneBonus={50} />,
    );
    expect(getByText('350 pts')).toBeTruthy();
    rerender(<PickSummaryCard basePoints={200} playerBonus={100} zoneBonus={0} />);
    expect(getByText('300 pts')).toBeTruthy();
  });
});

