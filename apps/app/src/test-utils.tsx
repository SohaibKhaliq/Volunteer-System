import React, { ReactElement } from 'react'
import { render as originalRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Wrapper for providers
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) => {
    return {
        user: userEvent.setup(),
        ...originalRender(ui, { wrapper: createWrapper(), ...options }),
    }
}

export * from '@testing-library/react';
export { customRender as render };
