import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
};

type AuthPersistedState = {
  user: AuthUser | null;
  idToken: string | null;
};

type AuthActions = {
  signIn: (user: AuthUser, idToken: string | null) => void;
  signOut: () => void;
};

export type AuthStore = AuthPersistedState & AuthActions;

const initialState: AuthPersistedState = {
  user: null,
  idToken: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      signIn: (user, idToken) => set({ user, idToken }),
      signOut: () => set(initialState),
    }),
    {
      name: 'personaltutor-auth',
      storage: zustandStorage,
      version: 1,
      partialize: (state): AuthPersistedState => ({
        user: state.user,
        idToken: state.idToken,
      }),
    }
  )
);
