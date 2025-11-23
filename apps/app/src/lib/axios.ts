import { FixType } from '@/types/utils';
import Axios, { AxiosRequestConfig } from 'axios';

import { toast } from '@/components/atoms/use-toast';
import { showApiError } from './error-to-toast';
import { API_URL } from './config';
import storage from './storage';

const authRequestInterceptor = (config: AxiosRequestConfig) => {
  const token = storage.getToken();
  console.log('AuthRequestInterceptor: token', token);
  if (config.headers) {
    // use standard Authorization header so backend auth middleware recognizes it
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers.Accept = 'application/json';
  }
  return config;
};

export const axios = Axios.create({
  baseURL: API_URL
});

axios.interceptors.request.use(authRequestInterceptor as FixType);
axios.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error?.config;
    // If unauthorized and we haven't retried yet, attempt a lightweight authenticate
    try {
      // never try to refresh if the failing request was already the authenticate endpoint
      const requestUrl = originalRequest?.url || '';
      if (
        error?.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !requestUrl.includes('/login') &&
        !requestUrl.includes('/register')
      ) {
        // Clear token and redirect to login
        storage.setToken('');
        try {
          toast({ title: 'Session expired', description: 'Please sign in again.' });
        } catch (e) {
          console.warn('Unable to show toast', e);
        }

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
          window.location.href = `/login?returnTo=${returnTo}`;
        }
        return Promise.reject(error);
      }
    } catch (refreshErr) {
      return Promise.reject(refreshErr);
    }

    const message = error?.response?.data?.message || error?.message;
    // Map API errors to toast UI as a best-effort
    try {
      showApiError(error, 'Request failed');
    } catch (e) {
      // fallback to console
      console.error(message);
    }
    return Promise.reject(error);
  }
);
