import NotFound from '@/components/molecules/404';
import Layout from '@/components/templates/layout';
import Carpooling from '@/pages/carpooling';
import Detail from '@/pages/detail';
import Help from '@/pages/help';
import HelpOfferForm from '@/pages/help-offer-form';
import HelpRequestForm from '@/pages/help-request-form';
import Home from '@/pages/home';
import Map from '@/pages/map';
import TransportOfferForm from '@/pages/transport-offer-form';
import TransportRequestForm from '@/pages/transport-request-form';
import { RouteObject } from 'react-router-dom';
import AdminLayout from '@/components/templates/AdminLayout';
import AdminUsers from '@/pages/admin/users';
import AdminOrganizations from '@/pages/admin/organizations';
import AdminEvents from '@/pages/admin/events';
import AdminTasks from '@/pages/admin/tasks';
import AdminCompliance from '@/pages/admin/compliance';
import AdminReports from '@/pages/admin/reports';

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
    children: [
      { path: '/admin', element: <AdminUsers /> },
      { path: '/admin/users', element: <AdminUsers /> },
      { path: '/admin/organizations', element: <AdminOrganizations /> },
      { path: '/admin/events', element: <AdminEvents /> },
      { path: '/admin/tasks', element: <AdminTasks /> },
      { path: '/admin/compliance', element: <AdminCompliance /> },
      { path: '/admin/reports', element: <AdminReports /> },
    ]
  },
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
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
    children: Object.values(DetailTypes).map((type) => ({
      path: `/detail/${type}/:id`,
      element: <Detail />
    }))
  },
  {
    path: '*',
    element: <Layout />,
    children: [{ path: '*', element: <NotFound /> }]
  }
];

export default routes;
