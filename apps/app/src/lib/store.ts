import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEY } from './config';

export interface State {
  token: string;
  user: any | null;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      token: '',
      user: null,
      setToken: (token: string) => set({ token }),
      setUser: (user: any) => set({ user }),
      logout: () => set({ token: '', user: null })
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage)
    }
  )
);
