import { toast } from '@/components/atoms/use-toast';

export function showApiError(err: any, title = 'Error') {
  try {
    const message =
      err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Something went wrong';
    toast({ title, description: message });
  } catch (e) {
    // best-effort; don't crash
    // eslint-disable-next-line no-console
    console.warn('showApiError failed', e);
  }
}

export default showApiError;
