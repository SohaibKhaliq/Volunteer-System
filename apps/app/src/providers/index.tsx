import i18n from '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'sonner';
import ThemeProvider from './theme-provider';
import SocketProvider from './socket-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
});

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n} defaultNS={'common'}>
          <ThemeProvider defaultTheme="light" storageKey="theme">
            <SocketProvider>
              {children}
              <Toaster position="top-right" richColors />
            </SocketProvider>
          </ThemeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </>
  );
};

export default Providers;
