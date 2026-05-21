import React from 'react';
import { render } from '@testing-library/react-native';
import { TypeBadge } from './TypeBadge';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('TypeBadge', () => {
  it('match variant renders "MATCH" with lime colour', () => {
    const { getByText } = render(<TypeBadge variant="match" />);
    const el = getByText('MATCH');
    expect(el).toBeTruthy();
    const style = Array.isArray(el.props.style)
      ? Object.assign({}, ...el.props.style)
      : el.props.style;
    expect(style).toMatchObject({ color: '#B4FF32' });
  });

  it('moment variant renders "MOMENT" with violet colour', () => {
    const { getByText } = render(<TypeBadge variant="moment" />);
    const el = getByText('MOMENT');
    expect(el).toBeTruthy();
    const style = Array.isArray(el.props.style)
      ? Object.assign({}, ...el.props.style)
      : el.props.style;
    expect(style).toMatchObject({ color: '#A78BFA' });
  });
});

