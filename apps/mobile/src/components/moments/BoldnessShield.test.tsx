import React from 'react';
import { render } from '@testing-library/react-native';
import { BoldnessShield } from './BoldnessShield';

describe('BoldnessShield', () => {
  it.each([
    ['bronze', 'B'],
    ['silver', 'S'],
    ['gold', 'G'],
    ['platinum', 'P'],
  ] as const)('%s tier renders correct letter', (tier, letter) => {
    const { getByText } = render(<BoldnessShield tier={tier} />);
    expect(getByText(letter)).toBeTruthy();
  });

  it('has accessibilityRole="image"', () => {
    const { UNSAFE_getAllByProps } = render(<BoldnessShield tier="gold" />);
    const elements = UNSAFE_getAllByProps({ accessibilityRole: 'image' });
    expect(elements.length).toBeGreaterThan(0);
  });
});

