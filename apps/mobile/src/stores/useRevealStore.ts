import {create} from 'zustand';

interface RevealStoreState {
    firstView: boolean;
    reduceMotion: boolean;
    revealIndex: number;
    setFirstView: (value: boolean) => void;
    setReduceMotion: (value: boolean) => void;
    advanceReveal: () => void;
    resetReveal: () => void;
}

export const useRevealStore = create<RevealStoreState>((set) => ({
    firstView: true,
    reduceMotion: false,
    revealIndex: 0,
    setFirstView: (value) => set({firstView: value}),
    setReduceMotion: (value) => set({reduceMotion: value}),
    advanceReveal: () => set((state) => ({revealIndex: state.revealIndex + 1})),
    resetReveal: () => set({firstView: true, revealIndex: 0}),
}));

