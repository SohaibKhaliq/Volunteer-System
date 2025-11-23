import NotFound from '@/components/molecules/404';
import ErrorBoundary from '@/components/atoms/ErrorBoundary';
import Layout from '@/components/templates/layout';
import Carpooling from '@/pages/carpooling';
import Detail from '@/pages/detail';
import Help from '@/pages/help';
import HelpOfferForm from '@/pages/help-offer-form';
import HelpRequestForm from '@/pages/help-request-form';
import Home from '@/pages/home';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Map from '@/pages/map';
import TransportOfferForm from '@/pages/transport-offer-form';
import TransportRequestForm from '@/pages/transport-request-form';
import { RouteObject } from 'react-router-dom';
import AdminLayout from '@/components/templates/AdminLayout';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminUsers from '@/pages/admin/users';
import AdminOrganizations from '@/pages/admin/organizations';
import AdminEvents from '@/pages/admin/events';
import AdminTasks from '@/pages/admin/tasks';
import AdminHours from '@/pages/admin/hours'; // Added this import based on the instruction's context
import AdminCertifications from '@/pages/admin/certifications';
import AdminCompliance from '@/pages/admin/compliance';
import AdminReports from '@/pages/admin/reports';
import AdminCommunications from '@/pages/admin/communications';

export enum DetailTypes {
  Offer = 'offer',
  Request = 'request',
  RideRequest = 'ride-request',
  RideOffer = 'ride-offer'
}

const routes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/admin/users', element: <AdminUsers /> },
      { path: '/admin/organizations', element: <AdminOrganizations /> },
      { path: '/admin/events', element: <AdminEvents /> },
      { path: '/admin/tasks', element: <AdminTasks /> },
      { path: '/admin/hours', element: <AdminHours /> },
      { path: '/admin/compliance', element: <AdminCompliance /> },
      { path: '/admin/certifications', element: <AdminCertifications /> },
      { path: '/admin/communications', element: <AdminCommunications /> },
      { path: '/admin/reports', element: <AdminReports /> },
    ]
  },
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/map', element: <Map /> },
      { path: '/carpooling', element: <Carpooling /> },
      { path: '/help', element: <Help /> },
      { path: '/help-request', element: <HelpRequestForm /> },
      { path: '/help-offer', element: <HelpOfferForm /> },
      { path: '/transport-request', element: <TransportRequestForm /> },
      { path: '/transport-offer', element: <TransportOfferForm /> }
    ]
  },
  {
    path: '/detail',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: Object.values(DetailTypes).map((type) => ({
      path: `/detail/${type}/:id`,
      element: <Detail />
    }))
  },
  {
    path: '*',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [{ path: '*', element: <NotFound /> }]
  }
];

export default routes;
