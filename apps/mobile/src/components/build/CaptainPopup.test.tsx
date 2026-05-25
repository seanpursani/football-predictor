import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { CaptainPopup } from './CaptainPopup';
import type { Prediction } from '@lecolpo/types';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 34, top: 44, left: 0, right: 0 }),
}));

const mockPick: Prediction = {
  id: 1,
  userId: 'user-abc',
  gameweekId: 5,
  fixtureId: 10,
  gameWeekMomentId: 42,
  predictionType: 'match',
  isCaptain: false,
  predictedMinute: null,
  confidenceWindow: null,
  predictedPlayerId: null,
  predictedAssisterId: null,
  predictedZone: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockMomentType = {
  id: 1,
  name: 'First Goalscorer',
  eventType: 'goal',
  predictionType: 'match',
  description: null,
  createdAt: new Date('2026-01-01'),
};

describe('CaptainPopup', () => {
  it('renders nothing when visible=false', () => {
    const { queryByText } = render(
      <CaptainPopup
        pick={mockPick}
        momentType={null}
        visible={false}
        onSelectCaptain={jest.fn()}
        onRemove={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(queryByText('👑 Select as Captain')).toBeNull();
  });

  it('renders buttons when visible=true', () => {
    const { getByText } = render(
      <CaptainPopup
        pick={mockPick}
        momentType={mockMomentType}
        visible={true}
        onSelectCaptain={jest.fn()}
        onRemove={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(getByText('👑 Select as Captain')).toBeTruthy();
    expect(getByText('✕ Remove pick')).toBeTruthy();
  });

  it('calls onSelectCaptain with the pick when captain button is tapped', () => {
    const onSelectCaptain = jest.fn();
    const { getByAccessibilityHint, getByLabelText } = render(
      <CaptainPopup
        pick={mockPick}
        momentType={mockMomentType}
        visible={true}
        onSelectCaptain={onSelectCaptain}
        onRemove={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText('Select as captain'));
    expect(onSelectCaptain).toHaveBeenCalledWith(mockPick);
  });

  it('calls onRemove with the pick when remove button is tapped', () => {
    const onRemove = jest.fn();
    const { getByLabelText } = render(
      <CaptainPopup
        pick={mockPick}
        momentType={mockMomentType}
        visible={true}
        onSelectCaptain={jest.fn()}
        onRemove={onRemove}
        onDismiss={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText('Remove this pick'));
    expect(onRemove).toHaveBeenCalledWith(mockPick);
  });

  it('calls onDismiss when backdrop is tapped', () => {
    const onDismiss = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <CaptainPopup
        pick={mockPick}
        momentType={mockMomentType}
        visible={true}
        onSelectCaptain={jest.fn()}
        onRemove={jest.fn()}
        onDismiss={onDismiss}
      />,
    );
    // Backdrop is the first TouchableOpacity rendered in the modal
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const backdrop = touchables.find((t) => t.props.accessibilityLabel === 'Dismiss');
    expect(backdrop).toBeTruthy();
    fireEvent.press(backdrop!);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows the momentType name as the context label', () => {
    const { getByText } = render(
      <CaptainPopup
        pick={mockPick}
        momentType={mockMomentType}
        visible={true}
        onSelectCaptain={jest.fn()}
        onRemove={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(getByText('First Goalscorer')).toBeTruthy();
  });

  it('falls back to pick ID label when momentType is null', () => {
    const { getByText } = render(
      <CaptainPopup
        pick={mockPick}
        momentType={null}
        visible={true}
        onSelectCaptain={jest.fn()}
        onRemove={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(getByText(`Pick #${mockPick.gameWeekMomentId}`)).toBeTruthy();
  });
});

