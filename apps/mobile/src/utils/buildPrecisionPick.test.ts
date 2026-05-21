import { buildPrecisionPick } from './buildPrecisionPick';

const BASE = {
  userId: 'user-1',
  gameweekId: 1,
  fixtureId: 10,
  momentCardId: 5,
  playerId: 'player-abc',
  minute: 45,
  zone: 10 as const,
};

describe('buildPrecisionPick', () => {
  it('goal event maps predictedPlayerId correctly and sets predictionType: moment', () => {
    const result = buildPrecisionPick({ ...BASE, eventType: 'goal' });
    expect(result.predictedPlayerId).toBe('player-abc');
    expect(result.predictionType).toBe('moment');
    expect(result.predictedAssisterId).toBeNull();
  });

  it('substitution event maps correctly', () => {
    const result = buildPrecisionPick({ ...BASE, eventType: 'substitution' });
    expect(result.predictedPlayerId).toBe('player-abc');
    expect(result.predictionType).toBe('moment');
    expect(result.predictedAssisterId).toBeNull();
    expect(result.predictedZone).toBeNull();
  });

  it('yellow_card event maps correctly and predictedAssisterId is null', () => {
    const result = buildPrecisionPick({ ...BASE, eventType: 'yellow_card' });
    expect(result.predictedPlayerId).toBe('player-abc');
    expect(result.predictedAssisterId).toBeNull();
    expect(result.predictionType).toBe('moment');
  });

  it('unknown event type sets all player fields to null', () => {
    const result = buildPrecisionPick({ ...BASE, eventType: 'unknown_event' });
    expect(result.predictedPlayerId).toBeNull();
    expect(result.predictedAssisterId).toBeNull();
    expect(result.predictedZone).toBeNull();
  });

  it('isCaptain is always false', () => {
    const eventTypes = ['goal', 'substitution', 'corner', 'yellow_card', 'red_card', 'unknown'];
    for (const eventType of eventTypes) {
      const result = buildPrecisionPick({ ...BASE, eventType });
      expect(result.isCaptain).toBe(false);
    }
  });

  it('stores minute as max 90 even when value is 91', () => {
    const result = buildPrecisionPick({ ...BASE, eventType: 'goal', minute: 91 });
    expect(result.predictedMinute).toBe(90);
  });

  it('corner event sets predictedZone to playerId', () => {
    const result = buildPrecisionPick({ ...BASE, eventType: 'corner' });
    expect(result.predictedZone).toBe('player-abc');
    expect(result.predictedPlayerId).toBeNull();
  });
});

