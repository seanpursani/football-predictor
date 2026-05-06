import { create } from 'zustand';

interface UnsavedPick {
  momentCardId: number;
  fixtureId: number;
}

interface BuildStoreState {
  expandedFixtureId: number | null;
  unsavedPicks: UnsavedPick[];
  setExpandedFixtureId: (id: number | null) => void;
  resetBuildState: () => void;
}

export const useBuildStore = create<BuildStoreState>((set) => ({
  expandedFixtureId: null,
  unsavedPicks: [],
  setExpandedFixtureId: (id) => set({ expandedFixtureId: id }),
  resetBuildState: () => set({ expandedFixtureId: null, unsavedPicks: [] }),
}));

