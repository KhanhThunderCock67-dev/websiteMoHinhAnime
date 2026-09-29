import { create } from 'zustand';
import { authApi } from '../api';

const savedToken = localStorage.getItem('hobby_vault_token') || null;
const savedUser = localStorage.getItem('hobby_vault_user')
  ? JSON.parse(localStorage.getItem('hobby_vault_user'))
  : null;

export const useAuthStore = create((set, get) => ({
  user: savedUser,
  token: savedToken,
  isAuthenticated: !!savedToken,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { user, token } = response.data.data;

      localStorage.setItem('hobby_vault_token', token);
      localStorage.setItem('hobby_vault_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(userData);
      const { user, token } = response.data.data;

      localStorage.setItem('hobby_vault_token', token);
      localStorage.setItem('hobby_vault_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('hobby_vault_token');
    localStorage.removeItem('hobby_vault_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    if (!get().token) return;
    try {
      const response = await authApi.getProfile();
      const user = response.data.data.user;
      localStorage.setItem('hobby_vault_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (err) {
      get().logout();
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.updateProfile(data);
      const updatedUser = response.data.data.user;
      localStorage.setItem('hobby_vault_user', JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      return { success: true, user: updatedUser };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  clearError: () => set({ error: null }),
}));
