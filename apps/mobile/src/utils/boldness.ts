export type BoldnessTierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

export function deriveBoldnessTier(totalPoints: number): BoldnessTierKey {
  if (totalPoints >= 5000) return 'platinum';
  if (totalPoints >= 2500) return 'gold';
  if (totalPoints >= 1000) return 'silver';
  return 'bronze';
}

export const TIER_NAMES: Record<BoldnessTierKey, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export const TIER_COLOURS: Record<BoldnessTierKey, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

