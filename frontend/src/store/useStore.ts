import { create } from 'zustand';

interface State {
  count: number;
  increment: () => void;
}

export const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));