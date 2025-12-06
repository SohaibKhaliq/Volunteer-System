// Lightweight wrapper that delegates to Sonner for toasts.
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

type ToastOptions = Parameters<typeof sonnerToast>[1] | undefined;

type MessageObject = {
  title?: string;
  description?: string;
  variant?: 'success' | 'destructive' | 'error' | 'warning' | 'info';
};

function baseToast(message: string | MessageObject, opts?: ToastOptions) {
  // Keep compatibility with previous signature where callers passed an object
  if (typeof message === 'object') {
    const title = (message as MessageObject).title;
    const description = (message as MessageObject).description;
    const variant = (message as MessageObject).variant as string | undefined;
    const content = `${title ? title + ': ' : ''}${description ?? ''}`.trim();

    if (variant === 'success') {
      sonnerToast.success(content || 'Success');
    } else if (variant === 'destructive' || variant === 'error') {
      sonnerToast.error(content || 'Error');
    } else if (variant === 'warning') {
      sonnerToast(content || '');
    } else {
      sonnerToast(content || '');
    }

    return {
      dismiss: (id?: string) => sonnerToast.dismiss(id),
      update: () => {}
    };
  }
  sonnerToast(message as string, opts);
  return {
    dismiss: (id?: string) => sonnerToast.dismiss(id),
    update: () => {}
  };
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string) => sonnerToast.dismiss(id),
    ToasterComponent: SonnerToaster
  };
}
// Create an exported toast object that includes Sonner-like helpers.
const toast = Object.assign(baseToast, {
  success: (message: string, opts?: ToastOptions) => sonnerToast.success(message, opts),
  error: (message: string, opts?: ToastOptions) => sonnerToast.error(message, opts),
  custom: (renderer: any, opts?: ToastOptions) => sonnerToast.custom(renderer, opts as any)
});

export { toast, useToast };
