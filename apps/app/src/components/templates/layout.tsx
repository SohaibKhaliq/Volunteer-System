import Providers from '@/providers';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import LoadingSpinner from '../atoms/loading-spinner';
// Toaster is provided globally in `src/providers/index.tsx`; avoid duplicate renders
import Header from '../molecules/header';

const Layout = () => {
  const { i18n } = useTranslation();

  const hideHeaderRoutes = ['/detail'];
  const location = useLocation();

  document.body.dir = i18n.dir();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Providers>
        <div className="flex flex-col min-h-screen">
          {!hideHeaderRoutes.some((route) => location.pathname.includes(route)) && <Header />}
          <main className="flex-grow overflow-y-auto w-full bg-background">
            <Outlet />
          </main>
        </div>
      </Providers>
    </Suspense>
  );
};

export default Layout;
