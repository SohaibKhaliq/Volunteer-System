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
import AppProvider from '@/providers/app-provider';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminUsers from '@/pages/admin/users';
import AdminOrganizations from '@/pages/admin/organizations';
import AdminEvents from '@/pages/admin/events';
import AdminTasks from '@/pages/admin/tasks';
import AdminHours from '@/pages/admin/hours'; // Added this import based on the instruction's context
import AdminCertifications from '@/pages/admin/certifications';
import AdminNotifications from '@/pages/admin/notifications';
import AdminCompliance from '@/pages/admin/compliance';
import AdminReports from '@/pages/admin/reports';
import AdminCommunications from '@/pages/admin/communications';
import AdminResources from '@/pages/admin/resources';
import AdminScheduling from '@/pages/admin/scheduling';
import AdminFeedback from '@/pages/admin/feedback';
import AdminAuditLogs from '@/pages/admin/audit-logs';
import AdminSettings from '@/pages/admin/settings';
import AdminVolunteerProfile from '@/pages/admin/volunteer-profile';

// Simple wrappers to ensure pages are vertically scrollable
const ScrollWrapper = ({ children }: any) => (
  <div style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>{children}</div>
);

const AdminScrollWrapper = ({ children }: any) => (
  <div style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>{children}</div>
);
export enum DetailTypes {
  Offer = 'offer',
  Request = 'request',
  RideRequest = 'ride-request',
  RideOffer = 'ride-offer'
}

const routes: RouteObject[] = [
  {
    path: 'admin',
    element: (
      <AdminScrollWrapper>
        <AppProvider>
          <AdminLayout />
        </AppProvider>
      </AdminScrollWrapper>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'organizations', element: <AdminOrganizations /> },
      { path: 'events', element: <AdminEvents /> },
      { path: 'tasks', element: <AdminTasks /> },
      { path: 'hours', element: <AdminHours /> },
      { path: 'compliance', element: <AdminCompliance /> },
      { path: 'certifications', element: <AdminCertifications /> },
      { path: 'notifications', element: <AdminNotifications /> },
      { path: 'communications', element: <AdminCommunications /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'resources', element: <AdminResources /> },
      { path: 'scheduling', element: <AdminScheduling /> },
      { path: 'feedback', element: <AdminFeedback /> },
      { path: 'audit-logs', element: <AdminAuditLogs /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'volunteer-profile', element: <AdminVolunteerProfile /> }
    ]
  },
  {
    path: '/',
    element: (
      <ScrollWrapper>
        <AppProvider>
          <Layout />
        </AppProvider>
      </ScrollWrapper>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'map', element: <Map /> },
      { path: 'carpooling', element: <Carpooling /> },
      { path: 'help', element: <Help /> },
      { path: 'help-request', element: <HelpRequestForm /> },
      { path: 'help-offer', element: <HelpOfferForm /> },
      { path: 'transport-request', element: <TransportRequestForm /> },
      { path: 'transport-offer', element: <TransportOfferForm /> }
    ]
  },
  {
    path: 'detail',
    element: (
      <ScrollWrapper>
        <Layout />
      </ScrollWrapper>
    ),
    errorElement: <ErrorBoundary />,
    children: Object.values(DetailTypes).map((type) => ({
      path: `${type}/:id`,
      element: <Detail />
    }))
  },
  {
    path: '*',
    element: (
      <ScrollWrapper>
        <Layout />
      </ScrollWrapper>
    ),
    errorElement: <ErrorBoundary />,
    children: [{ path: '*', element: <NotFound /> }]
  }
];

export default routes;
