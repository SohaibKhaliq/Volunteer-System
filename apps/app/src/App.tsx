import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import LoadingSpinner from './components/atoms/loading-spinner';
import routes from './lib/routes';
import Providers from './providers';

const router = createBrowserRouter(routes);

const App = () => {
  return (
    <Providers>
      <RouterProvider router={router} fallbackElement={<LoadingSpinner />} />
    </Providers>
  );
};

export default App;
