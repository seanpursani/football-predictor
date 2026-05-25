import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ZoneChip } from './ZoneChip';

describe('ZoneChip', () => {
  it('renders three chips ±5, ±10, ±15', () => {
    const { getByText } = render(
      <ZoneChip value={10} onChange={() => {}} />,
    );
    expect(getByText('±5')).toBeTruthy();
    expect(getByText('±10')).toBeTruthy();
    expect(getByText('±15')).toBeTruthy();
  });

  it('active chip is ±10 when value={10}', () => {
    const { getAllByRole } = render(
      <ZoneChip value={10} onChange={() => {}} />,
    );
    const radios = getAllByRole('radio');
    const active = radios.find((r) => r.props.accessibilityState?.checked === true);
    expect(active?.props.accessibilityLabel).toContain('10');
  });

  it('tapping ±5 chip calls onChange(5)', () => {
    const onChange = jest.fn();
    const { getByText } = render(<ZoneChip value={10} onChange={onChange} />);
    fireEvent.press(getByText('±5'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('each chip has accessibilityRole="radio"', () => {
    const { getAllByRole } = render(
      <ZoneChip value={10} onChange={() => {}} />,
    );
    const radios = getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });
});

