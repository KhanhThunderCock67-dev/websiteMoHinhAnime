import { create } from 'zustand';

const initialFilters = {
  category: '',
  subCategory: '',
  brand: '',
  faction: '',
  scale: '',
  complexity: '',
  players: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  isPreOrder: '',
  keyword: '',
  sort: 'newest',
  page: 1,
};

export const useFilterStore = create((set) => ({
  filters: initialFilters,

  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        page: 1, // Reset page when changing any filter
      },
    }));
  },

  setCategory: (categorySlug) => {
    set((state) => ({
      filters: {
        ...state.filters,
        category: categorySlug,
        subCategory: '',
        faction: '',
        scale: '',
        complexity: '',
        players: '',
        page: 1,
      },
    }));
  },

  setPage: (page) => {
    set((state) => ({
      filters: {
        ...state.filters,
        page,
      },
    }));
  },

  setKeyword: (keyword) => {
    set((state) => ({
      filters: {
        ...state.filters,
        keyword,
        page: 1,
      },
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },
}));
