import { create } from "zustand";
import type { UserDto } from "@trip-planner/shared";
import { setAccessToken } from "../lib/api";

type AuthState = {
  user: UserDto | null;
  setSession: (user: UserDto, token: string) => void;
  updateUser: (user: UserDto) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setSession: (user, token) => {
    setAccessToken(token);
    set({ user });
  },
  updateUser: (user) => set({ user }),
  clear: () => {
    setAccessToken(null);
    set({ user: null });
  }
}));
