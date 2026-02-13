import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserAuthState {
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  clearAuth: () => void;
}

export const useUserAuthStore = create<UserAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      setAuthenticated: (auth: boolean) => set({ isAuthenticated: auth }),
      clearAuth: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'user-auth-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);