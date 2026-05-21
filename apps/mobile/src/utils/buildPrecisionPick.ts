import type { NewPrediction } from '@lecolpo/types';

export interface BuildPrecisionPickParams {
  userId: string;
  gameweekId: number;
  fixtureId: number;
  momentCardId: number;
  eventType: string;
  playerId: string | null;
  minute: number;
  zone: 5 | 10 | 15;
}

export function buildPrecisionPick(params: BuildPrecisionPickParams): NewPrediction {
  const { userId, gameweekId, fixtureId, momentCardId, eventType, playerId, minute, zone } = params;
  // Sanitise minute: store 90 not 91 (91 is the "90+" display alias)
  const storedMinute = Math.min(minute, 90);

  const base = {
    userId,
    gameweekId,
    fixtureId,
    gameWeekMomentId: momentCardId,
    predictionType: 'moment' as const,
    isCaptain: false,
    predictedMinute: storedMinute,
    confidenceWindow: zone,
  };

  switch (eventType) {
    case 'goal':
      return {
        ...base,
        predictedPlayerId: playerId,
        predictedAssisterId: null,
        predictedZone: null,
      };
    case 'substitution':
      return {
        ...base,
        predictedPlayerId: playerId,
        predictedAssisterId: null,
        predictedZone: null,
      };
    case 'corner':
      // For corner: playerId is reused as the corner zone value
      return {
        ...base,
        predictedPlayerId: null,
        predictedAssisterId: null,
        predictedZone: playerId,
      };
    case 'yellow_card':
      return {
        ...base,
        predictedPlayerId: playerId,
        predictedAssisterId: null,
        predictedZone: null,
      };
    case 'red_card':
      return {
        ...base,
        predictedPlayerId: playerId,
        predictedAssisterId: null,
        predictedZone: null,
      };
    default:
      return {
        ...base,
        predictedPlayerId: null,
        predictedAssisterId: null,
        predictedZone: null,
      };
  }
}

