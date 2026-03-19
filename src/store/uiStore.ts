import { create } from 'zustand';

interface UIState {
  searchQuery: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  setSearchQuery: (q: string) => void;
  setSortField: (field: string) => void;
  toggleSortOrder: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  searchQuery: '',
  sortField: 'lastResponse',
  sortOrder: 'desc',
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortField: (field) =>
    set((state) => ({
      sortField: field,
      sortOrder: state.sortField === field ? (state.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc',
    })),
  toggleSortOrder: () =>
    set((state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),
}));
