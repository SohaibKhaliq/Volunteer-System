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
import Organizations from '@/pages/organizations';
import OrganizationRegister from '@/pages/organization-register';
import TransportOfferForm from '@/pages/transport-offer-form';
import TransportRequestForm from '@/pages/transport-request-form';
import Profile from '@/pages/profile';
import NotificationsPage from '@/pages/notifications';
import { RouteObject } from 'react-router-dom';
import AdminLayout from '@/components/templates/AdminLayout';
import AppProvider from '@/providers/app-provider';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminUsers from '@/pages/admin/users';
import AdminOrganizations from '@/pages/admin/organizations';
import AdminAchievements from '@/pages/admin/achievements';
import AdminEvents from '@/pages/admin/events';
import AdminTasks from '@/pages/admin/tasks';
import AdminHours from '@/pages/admin/hours'; // Added this import based on the instruction's context
import AdminCertifications from '@/pages/admin/certifications';
import AdminNotifications from '@/pages/admin/notifications';
import AdminCompliance from '@/pages/admin/compliance';
import AdminReports from '@/pages/admin/reports';
import AdminCommunications from '@/pages/admin/communications';
import AdminResources from '@/pages/admin/resources';
import AdminResourcesDashboard from '@/pages/admin/resources-dashboard';
import AdminImports from '@/pages/admin/imports';
import AdminTemplates from '@/pages/admin/templates';
import AdminBackgroundChecks from '@/pages/admin/background-checks';
import AdminScheduling from '@/pages/admin/scheduling';
import AdminMonitoring from '@/pages/admin/monitoring';
import AdminBackup from '@/pages/admin/backup';
import AdminAnalytics from '@/pages/admin/analytics';
import AdminCalendar from '@/pages/admin/calendar';
import AdminFeedback from '@/pages/admin/feedback';
import AdminFeedbackCreate from '@/pages/admin/feedback/create';
import AdminFeedbackResults from '@/pages/admin/feedback/[id]/results';
import AdminExports from '@/pages/admin/exports';
import AdminShifts from '@/pages/admin/shifts';
import AdminRoles from '@/pages/admin/roles';
import AdminTypes from '@/pages/admin/types';
import AdminAuditLogs from '@/pages/admin/audit-logs';
import AdminSettings from '@/pages/admin/settings';
import AdminVolunteerProfile from '@/pages/admin/volunteer-profile';
import OrganizationLayout from '@/components/templates/OrganizationLayout';
import OrganizationDashboard from '@/pages/organization/dashboard';
import OrganizationProfile from '@/pages/organization/profile';
import OrganizationEvents from '@/pages/organization/events';
import OrganizationAchievements from '@/pages/organization/achievements';
import OrganizationVolunteers from '@/pages/organization/volunteers';
import OrganizationResources from '@/pages/organization/resources';
import OrganizationHoursApproval from '@/pages/organization/hours-approval';
import OrganizationCompliance from '@/pages/organization/compliance';
import OrganizationReports from '@/pages/organization/reports';
import OrganizationCommunications from '@/pages/organization/communications';
import OrganizationSettings from '@/pages/organization/settings';
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
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'organizations', element: <AdminOrganizations /> },
      { path: 'achievements', element: <AdminAchievements /> },
      { path: 'events', element: <AdminEvents /> },
      { path: 'shifts', element: <AdminShifts /> },
      { path: 'tasks', element: <AdminTasks /> },
      { path: 'hours', element: <AdminHours /> },
      { path: 'compliance', element: <AdminCompliance /> },
      { path: 'certifications', element: <AdminCertifications /> },
      { path: 'notifications', element: <AdminNotifications /> },
      { path: 'background-checks', element: <AdminBackgroundChecks /> },
      { path: 'templates', element: <AdminTemplates /> },
      { path: 'communications', element: <AdminCommunications /> },
      { path: 'backup', element: <AdminBackup /> },
      { path: 'analytics', element: <AdminAnalytics /> },
      { path: 'calendar', element: <AdminCalendar /> },
      { path: 'monitoring', element: <AdminMonitoring /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'exports', element: <AdminExports /> },
      { path: 'resources', element: <AdminResources /> },
      { path: 'resources/dashboard', element: <AdminResourcesDashboard /> },
      { path: 'imports', element: <AdminImports /> },
      { path: 'scheduling', element: <AdminScheduling /> },
      { path: 'feedback', element: <AdminFeedback /> },
      { path: 'feedback/create', element: <AdminFeedbackCreate /> },
      { path: 'feedback/:id/results', element: <AdminFeedbackResults /> },
      { path: 'audit-logs', element: <AdminAuditLogs /> },
      { path: 'roles', element: <AdminRoles /> },
      { path: 'types', element: <AdminTypes /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'volunteer-profile', element: <AdminVolunteerProfile /> }
    ]
  },
  {
    path: 'organization',
    element: (
      <AdminScrollWrapper>
        <AppProvider>
          <OrganizationLayout />
        </AppProvider>
      </AdminScrollWrapper>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <OrganizationDashboard /> },
      { path: 'profile', element: <OrganizationProfile /> },
      { path: 'events', element: <OrganizationEvents /> },
      { path: 'resources', element: <OrganizationResources /> },
      { path: 'achievements', element: <OrganizationAchievements /> },
      { path: 'volunteers', element: <OrganizationVolunteers /> },
      { path: 'hours-approval', element: <OrganizationHoursApproval /> },
      { path: 'compliance', element: <OrganizationCompliance /> },
      { path: 'reports', element: <OrganizationReports /> },
      { path: 'communications', element: <OrganizationCommunications /> },
      { path: 'settings', element: <OrganizationSettings /> }
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
