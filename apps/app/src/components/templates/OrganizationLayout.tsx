import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '@/providers/app-provider';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  ShieldCheck,
  FileBarChart,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Providers from '@/providers';

export default function OrganizationLayout() {
  const { user, authenticated } = useApp();
  const location = useLocation();

  // Navigation items for Organization Panel
  const navItems = [
    { path: '/organization', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/organization/profile', icon: Building2, label: 'Profile' },
    { path: '/organization/events', icon: Calendar, label: 'Events & Tasks' },
    { path: '/organization/volunteers', icon: Users, label: 'Volunteers' },
    { path: '/organization/compliance', icon: ShieldCheck, label: 'Compliance' },
    { path: '/organization/reports', icon: FileBarChart, label: 'Reports' },
    { path: '/organization/communications', icon: MessageSquare, label: 'Communications' },
    { path: '/organization/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <Providers>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                <h2 className="font-bold text-xl text-gray-800">Organization</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">Management Portal</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                // Handle exact match for root path to avoid highlighting dashboard on subpages if not desired,
                // but usually dashboard is just /organization so startsWith might be too broad if we have /organization/profile
                // Let's refine:
                const isExactActive = location.pathname === item.path;
                const isSubActive = item.path !== '/organization' && location.pathname.startsWith(item.path);
                const active = isExactActive || isSubActive;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      active
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', active ? 'text-blue-700' : 'text-gray-500')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0] || 'O'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                </div>
              </div>
              <Link to="/">
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit Portal
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
                  <p className="text-sm text-gray-500 mt-1">Manage your organization's activities</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
                  </Button>
                  <div className="text-sm text-gray-600">
                    Organization: <span className="font-medium">Eghata Foundation</span>
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
