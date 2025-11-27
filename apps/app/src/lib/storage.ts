// TODO: use localforage or whatever capacitor uses

import { STORAGE_KEY } from './config';
import { useStore } from '@/lib/store';

const loadPersistedState = () => {
  const persistedState = localStorage.getItem(STORAGE_KEY);
  if (persistedState) {
    return JSON.parse(persistedState);
  }
  return {};
};

const storage = {
  getToken() {
    // Prefer in-memory store token if available (faster and avoids race conditions
    // during login where localStorage may not have been written yet).
    try {
      const runtime = useStore.getState();
      if (runtime && runtime.token) return runtime.token;
    } catch (e) {
      // ignore if store isn't available in some contexts
    }

    const state = loadPersistedState();
    return state?.state?.token;
  },
  setToken(token: string) {
    // Update in-memory store (if available) then persist to localStorage
    try {
      useStore.getState().setToken(token);
    } catch (e) {
      // ignore if store isn't accessible
    }

    const state = loadPersistedState();
    state.state = { ...state.state, token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

export default storage;
