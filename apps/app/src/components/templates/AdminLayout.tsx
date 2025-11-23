import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '@/providers/app-provider';
import { cn } from '@/lib/utils';
import { Users, Building2, Calendar, ClipboardCheck, Shield, BarChart3, Home, MessageSquare, CalendarClock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Providers from '@/providers';

export default function AdminLayout() {
  const { user, authenticated } = useApp();
  const location = useLocation();

  // Check if user has admin privileges
  // Support multiple ways: isAdmin flag, is_admin flag, or 'admin' role
  // TEMPORARILY DISABLED FOR DEBUGGING - RE-ENABLE AFTER ROLES/PERMISSIONS ARE CONFIGURED
  const isAdmin = true; // Temporarily allow all authenticated users
  
  /* Original admin check - re-enable this after configuring roles/permissions:
  const isAdmin = !!(
    user?.isAdmin || 
    user?.is_admin || 
    (user?.roles && Array.isArray(user.roles) && user.roles.some((r: any) => 
      r.name === 'admin' || r.name === 'Admin' || r.role === 'admin' || r.role === 'Admin'
    ))
  );
  */

  // Debug logging (remove in production)
  useEffect(() => {
    console.log('AdminLayout - User:', user);
    console.log('AdminLayout - Authenticated:', authenticated);
    console.log('AdminLayout - IsAdmin:', isAdmin);
    console.log('AdminLayout - User roles:', user?.roles);
  }, [user, authenticated, isAdmin]);

  // If user is not authed, redirect to root
  // useEffect(() => {
  //   if (!authenticated) {
  //     console.log('Not authenticated, redirecting to home');
  //     navigate('/');
  //   }
  // }, [authenticated, navigate]);

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

  const navItems = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users & Roles' },
    { path: '/admin/organizations', icon: Building2, label: 'Organizations' },
    { path: '/admin/events', icon: Calendar, label: 'Events & Tasks' },
    { path: '/admin/tasks', icon: ClipboardCheck, label: 'Task Management' },
    { path: '/admin/compliance', icon: Shield, label: 'Compliance' },
    { path: '/admin/hours', icon: CalendarClock, label: 'Volunteer Hours' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports & Analytics' },
  ];

  return (
    <Providers>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-bold text-xl text-gray-800">Admin Panel</h2>
              <p className="text-sm text-gray-500 mt-1">Volunteer Management System</p>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
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
                    <span>{item.label}</span>
                  </Link>
                );
              })}
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
              <Link to="/">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Main Site
                </Button>
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen">
            <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and monitor your volunteer system
                  </p>
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
              <div className="text-sm text-gray-500 text-center">
                © 2025 Eghata Volunteer System. All rights reserved.
              </div>
            </footer>
          </div>
        </div>
      </div>
    </Providers>
  );
}
