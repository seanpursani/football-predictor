import {useGameweekStore} from './useGameweekStore';
import {useBuildStore} from './useBuildStore';
import {useRevealStore} from './useRevealStore';

describe('useGameweekStore', () => {
    beforeEach(() => {
        useGameweekStore.setState({phase: null, currentGameweekId: null});
    });

    it('initializes with correct default state', () => {
        const state = useGameweekStore.getState();
        expect(state.phase).toBeNull();
        expect(state.currentGameweekId).toBeNull();
    });

    it('setPhase updates phase', () => {
        useGameweekStore.getState().setPhase('building');
        expect(useGameweekStore.getState().phase).toBe('building');
    });

    it('setCurrentGameweekId updates id', () => {
        useGameweekStore.getState().setCurrentGameweekId(5);
        expect(useGameweekStore.getState().currentGameweekId).toBe(5);
    });

    it('does not contain server data properties', () => {
        const keys = Object.keys(useGameweekStore.getState());
        expect(keys).not.toContain('gameweek');
        expect(keys).not.toContain('fixtures');
        expect(keys).not.toContain('isLoading');
    });
});

describe('useBuildStore', () => {
    beforeEach(() => {
        useBuildStore.setState({expandedFixtureId: null, unsavedPicks: []});
    });

    it('initializes with correct default state', () => {
        const state = useBuildStore.getState();
        expect(state.expandedFixtureId).toBeNull();
        expect(state.unsavedPicks).toEqual([]);
    });

    it('setExpandedFixtureId updates id', () => {
        useBuildStore.getState().setExpandedFixtureId(42);
        expect(useBuildStore.getState().expandedFixtureId).toBe(42);
    });

    it('resetBuildState resets to defaults', () => {
        useBuildStore.getState().setExpandedFixtureId(42);
        useBuildStore.getState().resetBuildState();
        expect(useBuildStore.getState().expandedFixtureId).toBeNull();
        expect(useBuildStore.getState().unsavedPicks).toEqual([]);
    });

    it('does not contain server data properties', () => {
        const keys = Object.keys(useBuildStore.getState());
        expect(keys).not.toContain('predictions');
        expect(keys).not.toContain('isLoading');
    });
});

describe('useRevealStore', () => {
    beforeEach(() => {
        useRevealStore.setState({firstView: true, reduceMotion: false, revealIndex: 0});
    });

    it('initializes with correct default state', () => {
        const state = useRevealStore.getState();
        expect(state.firstView).toBe(true);
        expect(state.reduceMotion).toBe(false);
        expect(state.revealIndex).toBe(0);
    });

    it('advanceReveal increments revealIndex', () => {
        useRevealStore.getState().advanceReveal();
        expect(useRevealStore.getState().revealIndex).toBe(1);
        useRevealStore.getState().advanceReveal();
        expect(useRevealStore.getState().revealIndex).toBe(2);
    });

    it('resetReveal resets firstView and revealIndex', () => {
        useRevealStore.getState().setFirstView(false);
        useRevealStore.getState().advanceReveal();
        useRevealStore.getState().resetReveal();
        expect(useRevealStore.getState().firstView).toBe(true);
        expect(useRevealStore.getState().revealIndex).toBe(0);
    });

    it('setReduceMotion updates value', () => {
        useRevealStore.getState().setReduceMotion(true);
        expect(useRevealStore.getState().reduceMotion).toBe(true);
    });

    it('does not contain server data properties', () => {
        const keys = Object.keys(useRevealStore.getState());
        expect(keys).not.toContain('results');
        expect(keys).not.toContain('isLoading');
    });
});

