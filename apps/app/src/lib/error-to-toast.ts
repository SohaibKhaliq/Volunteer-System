import { toast } from '@/components/atoms/use-toast';

export function showApiError(err: any, title = 'Error') {
  try {
    // Prefer structured API errors when available
    const resp = err?.response?.data;
    let message = err?.message || 'Something went wrong';

    if (resp) {
      // Laravel-style validation errors: { errors: { field: ['msg'] } }
      if (resp.errors && typeof resp.errors === 'object') {
        const parts: string[] = [];
        Object.values(resp.errors).forEach((v: any) => {
          if (Array.isArray(v)) parts.push(...v.map(String));
          else parts.push(String(v));
        });
        message = parts.join('\n');
      } else if (resp.error && resp.error.message) {
        message = resp.error.message;
      } else if (resp.message) {
        message = resp.message;
      }
    }

    // Show a friendly toast
    if (err?.response?.status && err.response.status >= 400) {
      toast.error(message);
    } else {
      toast.success(message);
    }
  } catch (e) {
    // best-effort; don't crash
    console.warn('showApiError failed', e);
  }
}

export default showApiError;
