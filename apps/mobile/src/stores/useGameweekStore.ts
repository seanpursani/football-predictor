import {create} from 'zustand';

type GameweekPhase = 'building' | 'locked' | 'reveal' | null;

interface GameweekStoreState {
    phase: GameweekPhase;
    currentGameweekId: number | null;
    setPhase: (phase: GameweekPhase) => void;
    setCurrentGameweekId: (id: number | null) => void;
}

export const useGameweekStore = create<GameweekStoreState>((set) => ({
    phase: null,
    currentGameweekId: null,
    setPhase: (phase) => set({phase}),
    setCurrentGameweekId: (id) => set({currentGameweekId: id}),
}));

