import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import LoadingSpinner from './components/atoms/loading-spinner';
import routes from './lib/routes';
import Providers from './providers';
import OfflineBanner from './components/molecules/offline-banner';

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true
  }
});

const App = () => {
  return (
    <Providers>
      <OfflineBanner />
      <RouterProvider router={router} fallbackElement={<LoadingSpinner />} />
    </Providers>
  );
};

export default App;
