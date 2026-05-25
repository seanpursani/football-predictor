import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MicroFlowPlayerRow } from './MicroFlowPlayerRow';
import type { MicroFlowPlayer } from '@/src/queries/useMicroFlowQuery';

const player: MicroFlowPlayer = {
  id: 'p1',
  name: 'Marcus Rashford',
  bonusPoints: 120,
  sortOrder: 0,
};

describe('MicroFlowPlayerRow', () => {
  it('renders player name and bonus points', () => {
    const { getByText } = render(
      <MicroFlowPlayerRow player={player} isSelected={false} onSelect={() => {}} />,
    );
    expect(getByText('Marcus Rashford')).toBeTruthy();
    expect(getByText('+120 pts')).toBeTruthy();
  });

  it('selected state applies via accessibilityState.checked', () => {
    const { getByRole } = render(
      <MicroFlowPlayerRow player={player} isSelected={true} onSelect={() => {}} />,
    );
    const row = getByRole('radio');
    expect(row.props.accessibilityState.checked).toBe(true);
  });

  it('pressing calls onSelect with the player', () => {
    const onSelect = jest.fn();
    const { getByRole } = render(
      <MicroFlowPlayerRow player={player} isSelected={false} onSelect={onSelect} />,
    );
    fireEvent.press(getByRole('radio'));
    expect(onSelect).toHaveBeenCalledWith(player);
  });
});

