import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserAuthState {
  accessToken: string | null;
  refreshToken: string | null;

  /** 是否已登入（根據 accessToken 是否存在） */
  isAuthenticated: boolean;

  /** 儲存 tokens 並設定登入狀態 */
  setTokens: (accessToken: string, refreshToken: string) => void;

  /** 清除所有認證狀態 */
  clearAuth: () => void;
}

export const useUserAuthStore = create<UserAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken: string, refreshToken: string) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: "user-auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);