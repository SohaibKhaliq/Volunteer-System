import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '@/providers/app-provider';
import { cn } from '@/lib/utils';
import {
  Users,
  Building2,
  Calendar,
  ClipboardCheck,
  Shield,
  BarChart3,
  Home,
  CalendarClock,
  Award,
  Package,
  Clock,
  Activity,
  FileText,
  MessageSquare,
  Mail,
  ListOrdered,
  LogOut,
  User,
  Bell,
  Siren
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import useAdminSummary from '@/hooks/useAdminSummary';
import useFeatures from '@/hooks/useFeatures';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { showApiError } from '@/lib/error-to-toast';
import { toast } from '@/components/atoms/use-toast';
import { useNavigate } from 'react-router-dom';
import Providers from '@/providers';

export default function AdminLayout() {
  const { user, authenticated } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = useStore();

  const logoutMutation = useMutation(api.logout, {
    onSuccess: () => {
      setToken('');
      try {
        toast({ title: 'Signed out', description: 'You have been logged out.' });
      } catch (e) {}
      navigate('/login');
    },
    onError: (err: any) => {
      showApiError(err, 'Logout failed');
    }
  });

  // Check if user has admin privileges
  // Support multiple ways: isAdmin flag, is_admin flag, or 'admin' role
  const isAdmin = !!(
    user?.isAdmin ||
    user?.is_admin ||
    (user?.roles &&
      Array.isArray(user.roles) &&
      user.roles.some(
        (r: any) => r?.name === 'admin' || r?.name === 'Admin' || r?.role === 'admin' || r?.role === 'Admin'
      ))
  );

  // Keep admin checks quiet in production — no debug logs here

  // If user is not authed, redirect to login (run in effect to avoid synchronous navigation during render)
  useEffect(() => {
    if (!authenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`);
    }
  }, [authenticated, navigate, location.pathname, location.search, location.hash]);

  if (!authenticated) return null;

  // TEMPORARILY DISABLED FOR TESTING - RE-ENABLE AFTER TESTING
  // Show loading while checking authentication
  // if (!authenticated) {
  //   return null;
  // }

  // If authenticated but not admin, show forbidden
  // TEMPORARILY DISABLED - ALLOWING ALL ACCESS FOR TESTING
  // if (authenticated && !isAdmin) {
  //   console.log('User is authenticated but not admin');
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
  //         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //           <Shield className="h-8 w-8 text-red-600" />
  //         </div>
  //         <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
  //         <p className="text-gray-600 mb-4">
  //           You don't have permission to view the admin panel.
  //         </p>
  //         <div className="bg-gray-100 p-4 rounded mb-6 text-left">
  //           <p className="text-sm text-gray-700 mb-2"><strong>Debug Info:</strong></p>
  //           <p className="text-xs text-gray-600">Authenticated: {authenticated ? 'Yes' : 'No'}</p>
  //           <p className="text-xs text-gray-600">User ID: {user?.id || 'N/A'}</p>
  //           <p className="text-xs text-gray-600">Is Admin: {user?.isAdmin ? 'Yes' : 'No'}</p>
  //           <p className="text-xs text-gray-600">is_admin: {user?.is_admin ? 'Yes' : 'No'}</p>
  //           <p className="text-xs text-gray-600">Roles: {user?.roles ? JSON.stringify(user.roles) : 'None'}</p>
  //         </div>
  //         <Link to="/">
  //           <Button>
  //             <Home className="h-4 w-4 mr-2" />
  //             Go Home
  //           </Button>
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  // fetch admin summary counts for quick badges
  const { data: adminSummaryData } = useAdminSummary();

  const adminSummary: any = (adminSummaryData && (adminSummaryData.data ?? adminSummaryData)) || {};

  const pendingBackgroundChecksCount = Number(adminSummary.backgroundChecksPending || 0);
  const importsPendingCount = Number(adminSummary.importsPending || 0);
  const pendingHoursCount = Number(adminSummary.pendingHours || 0);
  const unreadNotificationsCount = Number(adminSummary.unreadNotifications || 0);

  // Feature flags — prefer server-driven flags and fall back to local role heuristic
  const isSuperAdmin = !!(
    user?.roles &&
    Array.isArray(user.roles) &&
    user.roles.some((r: any) => {
      const s = String(r?.name ?? r?.role ?? '').toLowerCase();
      return s.includes('owner') || s.includes('super') || s.includes('superadmin');
    })
  );

  const { data: featuresData } = useFeatures();

  const serverFeatures: any = (featuresData && (featuresData.data ?? featuresData)) || {};

  const features = {
    dataOps: serverFeatures.dataOps ?? isSuperAdmin, // imports/exports/backups
    analytics: serverFeatures.analytics ?? (isAdmin || isSuperAdmin),
    monitoring: serverFeatures.monitoring ?? isAdmin,
    scheduling: serverFeatures.scheduling ?? true
  };

  // Group sidebar links into semantic sections for clarity
  const sidebarGroups: {
    title?: string;
    items: Array<{
      path: string;
      icon: any;
      label: string;
      adminOnly?: boolean;
      showBadge?: boolean;
      feature?: string;
    }>;
  }[] = [
    {
      title: 'Overview',
      items: [
        { path: '/admin', icon: Home, label: 'Dashboard' },
        { path: '/admin/emergency-requests', icon: Siren, label: 'Emergency Requests', showBadge: true }
      ]
    },
    {
      title: 'Management',
      items: [
        { path: '/admin/users', icon: Users, label: 'Users & Roles' },
        { path: '/admin/roles', icon: Shield, label: 'Roles' },
        { path: '/admin/organizations', icon: Building2, label: 'Organizations' }
      ]
    },
    {
      title: 'Programs',
      items: [
        { path: '/admin/events', icon: Calendar, label: 'Events & Tasks' },
        { path: '/admin/tasks', icon: ClipboardCheck, label: 'Task Management' },
        { path: '/admin/shifts', icon: CalendarClock, label: 'Shifts' },
        { path: '/admin/hours', icon: CalendarClock, label: 'Volunteer Hours', showBadge: true },
        { path: '/admin/pending-hours/orgs', icon: CalendarClock, label: 'Pending Hours (by org)', adminOnly: true }
      ]
    },
    {
      title: 'Data & Ops',
      items: [
        { path: '/admin/resources', icon: Package, label: 'Resources' },
        { path: '/admin/resources/dashboard', icon: Activity, label: 'Resources Dashboard' },
        { path: '/admin/types', icon: FileText, label: 'Types' },
        { path: '/admin/achievements', icon: Award, label: 'Achievements' }
      ]
    },
    {
      title: 'Safety & Compliance',
      items: [
        { path: '/admin/compliance', icon: Shield, label: 'Compliance' },
        { path: '/admin/certifications', icon: Award, label: 'Certifications' },
        { path: '/admin/background-checks', icon: ClipboardCheck, label: 'Background Checks', showBadge: true }
      ]
    },
    {
      title: 'Integrations',
      items: [
        { path: '/admin/calendar', icon: Calendar, label: 'Calendars' },
        { path: '/admin/scheduling', icon: Clock, label: 'Scheduling' }
      ]
    },
    {
      title: 'Data & Exports',
      items: [
        {
          path: '/admin/imports',
          icon: ListOrdered,
          label: 'Imports',
          adminOnly: true,
          feature: 'dataOps',
          showBadge: true
        },
        { path: '/admin/exports', icon: ListOrdered, label: 'Exports', adminOnly: true, feature: 'dataOps' },
        { path: '/admin/backup', icon: Package, label: 'Backups', adminOnly: true, feature: 'dataOps' }
      ]
    },
    {
      title: 'Admin Tools',
      items: [
        { path: '/admin/notifications', icon: Bell, label: 'Notifications', showBadge: true },
        { path: '/admin/templates', icon: FileText, label: 'Templates' },
        { path: '/admin/communications', icon: MessageSquare, label: 'Communications' },
        { path: '/admin/invite-send-jobs', icon: Mail, label: 'Invite Send Jobs', adminOnly: true },
        { path: '/admin/scheduled-jobs', icon: Clock, label: 'Scheduled Jobs', adminOnly: true },
        { path: '/admin/feedback', icon: FileText, label: 'Feedback' },
        { path: '/admin/monitoring', icon: Activity, label: 'Monitoring', adminOnly: true, feature: 'monitoring' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', adminOnly: true, feature: 'analytics' },
        { path: '/admin/reports', icon: BarChart3, label: 'Reports & Analytics' },
        { path: '/admin/audit-logs', icon: ListOrdered, label: 'Audit Logs', adminOnly: true, feature: 'analytics' },
        { path: '/admin/settings', icon: LogOut, label: 'Settings' }
      ]
    }
  ];
  const currentLabel =
    sidebarGroups
      .flatMap((g) => g.items)
      .find((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))?.label ||
    'Dashboard';
  return (
    <Providers>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col min-h-0">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-bold text-xl text-gray-800">Admin Panel</h2>
              <p className="text-sm text-gray-500 mt-1">Volunteer Management System</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
              {sidebarGroups.map((group) => (
                <div key={group.title ?? 'group'}>
                  {group.title && (
                    <div className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                      {group.title}
                    </div>
                  )}
                  {group.items.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    if ((item as any).feature && !(features as any)[(item as any).feature]) return null;
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className={cn('h-5 w-5', isActive ? 'text-blue-700' : 'text-gray-500')} />
                        <span className="flex-1">{item.label}</span>
                        {item.showBadge ? (
                          // make the badge itself navigable to a filtered, actionable page
                          <button
                            onClick={(e) => {
                              // prevent the parent Link from handling click — we want a specific target
                              e.stopPropagation();
                              e.preventDefault();
                              let target = item.path;
                              if (item.path === '/admin/imports') target = '/admin/imports';
                              else if (item.path === '/admin/hours') target = '/admin/pending-hours';
                              else if (item.path === '/admin/notifications')
                                target = '/admin/notifications?filter=unread';
                              else if (item.path === '/admin/background-checks')
                                target = '/admin/background-checks?status=pending';
                              // navigate using react-router
                              navigate(target);
                            }}
                            aria-label={`Open ${item.label}`}
                            className="inline-flex items-center"
                          >
                            <Badge variant="secondary" className="text-xs">
                              {item.path === '/admin/background-checks'
                                ? pendingBackgroundChecksCount
                                : item.path === '/admin/imports'
                                  ? importsPendingCount
                                  : item.path === '/admin/hours'
                                    ? pendingHoursCount
                                    : item.path === '/admin/notifications'
                                      ? unreadNotificationsCount
                                      : ''}
                            </Badge>
                          </button>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Link to="/">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Main Site
                  </Button>
                </Link>

                {/* Logout button for admin panel */}
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen">
            <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentLabel}</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage and monitor your volunteer system</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    Welcome back, <span className="font-medium">{user?.firstName}</span>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 p-8">
              <Outlet />
            </main>

            <footer className="bg-white border-t border-gray-200 px-8 py-4">
              <div className="text-sm text-gray-500 text-center">© 2025 Local Aid. All rights reserved.</div>
            </footer>
          </div>
        </div>
      </div>
    </Providers>
  );
}
