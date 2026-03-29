import { create } from 'zustand';
import type { AuthUser, LoginCredentials } from '../shared/types/patient.types';
import { authService } from '../services/firebase/auth';
import { AUTH_ERRORS } from '../shared/constants/routes';

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? 'unknown';
      const message = AUTH_ERRORS[code] || 'Login failed. Please try again.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.loginWithGoogle();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? 'unknown';
      if (code === 'auth/popup-closed-by-user') {
        set({ isLoading: false, error: null });
        return;
      }
      const message = AUTH_ERRORS[code] || 'Google sign-in failed. Please try again.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearError: () => set({ error: null }),
}));
