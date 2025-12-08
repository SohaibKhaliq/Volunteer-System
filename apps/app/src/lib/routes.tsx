import NotFound from '@/components/molecules/404';
import ErrorBoundary from '@/components/atoms/ErrorBoundary';
import Layout from '@/components/templates/layout';
import Carpooling from '@/pages/carpooling';
import Detail from '@/pages/detail';
import Help from '@/pages/help';
import HelpOfferForm from '@/pages/help-offer-form';
import HelpRequestForm from '@/pages/help-request-form';
import Home from '@/pages/home';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import Map from '@/pages/map';
import Organizations from '@/pages/organizations';
import OrganizationRegister from '@/pages/organization-register';
import TransportOfferForm from '@/pages/transport-offer-form';
import TransportRequestForm from '@/pages/transport-request-form';
import Profile from '@/pages/profile';
import NotificationsPage from '@/pages/notifications';
import { RouteObject } from 'react-router-dom';
import AdminLayout from '@/components/templates/AdminLayout';
import AppProvider from '@/providers/app-provider';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import OrganizationLayout from '@/components/templates/OrganizationLayout';
import { OrgDashboard } from '@/pages/org/OrgDashboard';
import About from '@/pages/about';
import Contact from '@/pages/contact';
import Privacy from '@/pages/privacy';
import Terms from '@/pages/terms';
import Cookies from '@/pages/cookies';
import OrganizationDetail from '@/pages/organization-detail';
import VolunteerLayout from '@/components/templates/VolunteerLayout';
import VolunteerDashboard from '@/pages/volunteer/dashboard';
import VolunteerHistory from '@/pages/volunteer/history';
import VolunteerProfile from '@/pages/volunteer/profile';
import VolunteerSettings from '@/pages/volunteer/settings';
import FeedbackDashboard from '@/pages/feedback';
import TakeSurvey from '@/pages/feedback/[id]/take';

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
  RideOffer = 'ride-offer',
  Event = 'event'
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
      { path: 'dashboard', element: <AdminDashboard /> },
      // ... keep other existing admin routes if needed, but linking to our new Dashboard
      { index: true, element: <AdminDashboard /> },
    ]
  },
  {
    path: 'org', // New dedicated Org path to distinguish from legacy 'organization'
    element: (
      <AdminScrollWrapper>
        <AppProvider>
          <OrganizationLayout />
        </AppProvider>
      </AdminScrollWrapper>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <OrgDashboard /> },
      { path: 'dashboard', element: <OrgDashboard /> }
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
      { path: 'login', element: <LoginPage /> }, // Use new Login
      { path: 'register', element: <RegisterPage /> }, // Use new Register
      { path: 'map', element: <Map /> },
      { path: 'organizations', element: <Organizations /> },
      { path: 'organizations/register', element: <OrganizationRegister /> },
      { path: 'carpooling', element: <Carpooling /> },
      { path: 'help', element: <Help /> },
      { path: 'privacy', element: <Privacy /> },
      { path: 'terms', element: <Terms /> },
      { path: 'cookies', element: <Cookies /> },
      { path: 'help-request', element: <HelpRequestForm /> },
      { path: 'help-offer', element: <HelpOfferForm /> },
      { path: 'transport-request', element: <TransportRequestForm /> },
      { path: 'transport-offer', element: <TransportOfferForm /> },
      { path: 'profile', element: <Profile /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'about', element: <About /> },
      { path: 'feedback', element: <FeedbackDashboard /> },
      { path: 'feedback/:id/take', element: <TakeSurvey /> },
      { path: 'contact', element: <Contact /> },
      { path: 'organizations/:id', element: <OrganizationDetail /> },
      { path: 'events/:id', element: <Detail /> }
    ]
  },
  {
    path: 'volunteer',
    element: (
      <ScrollWrapper>
        <AppProvider>
          <VolunteerLayout />
        </AppProvider>
      </ScrollWrapper>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { path: 'dashboard', element: <VolunteerDashboard /> },
      { path: 'history', element: <VolunteerHistory /> },
      { path: 'profile', element: <VolunteerProfile /> },
      { path: 'settings', element: <VolunteerSettings /> }
    ]
  },
  {
    path: 'detail',
    element: (
      <ScrollWrapper>
        <AppProvider>
          <Layout />
        </AppProvider>
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
        <AppProvider>
          <Layout />
        </AppProvider>
      </ScrollWrapper>
    ),
    errorElement: <ErrorBoundary />,
    children: [{ path: '*', element: <NotFound /> }]
  }
];

export default routes;
