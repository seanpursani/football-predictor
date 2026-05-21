import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

import { DeadlineStrip } from './DeadlineStrip';

const MS = (h: number, m = 0) => (h * 60 + m) * 60 * 1000;

function deadlineIn(ms: number): Date {
  return new Date(Date.now() + ms);
}

describe('DeadlineStrip', () => {
  it('renders nothing when deadline is null', () => {
    const { toJSON } = render(<DeadlineStrip deadlineTimestamp={null} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when more than 3 hours remain (hidden state)', () => {
    const { toJSON } = render(<DeadlineStrip deadlineTimestamp={deadlineIn(MS(4))} />);
    expect(toJSON()).toBeNull();
  });

  it('renders approaching text (muted) for 2 hours remaining', () => {
    const { getByText } = render(<DeadlineStrip deadlineTimestamp={deadlineIn(MS(2))} />);
    expect(getByText('Deadline approaching')).toBeTruthy();
  });

  it('renders urgent orange text for under 1 hour remaining', () => {
    const { getByText } = render(
      <DeadlineStrip deadlineTimestamp={deadlineIn(MS(0, 45))} />,
    );
    const el = getByText('⚠️ Deadline under 1 hour');
    expect(el).toBeTruthy();
    const style = Array.isArray(el.props.style)
      ? Object.assign({}, ...el.props.style)
      : el.props.style;
    expect(style).toMatchObject({ color: '#FF6B35' });
  });

  it('renders critical strip for under 15 minutes', () => {
    const { getByText } = render(
      <DeadlineStrip deadlineTimestamp={deadlineIn(MS(0, 10))} />,
    );
    expect(getByText('🔴 Under 15 minutes to deadline!')).toBeTruthy();
  });
});

