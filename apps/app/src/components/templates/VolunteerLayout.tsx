import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, History, User, Settings, LogOut, Menu, X, List, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/molecules/notification-bell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/lib/store';
import api from '@/lib/api';

const VolunteerLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, setToken } = useStore();

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setToken('');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/volunteer/dashboard', icon: LayoutDashboard },
    { name: 'Opportunities', href: '/volunteer/opportunities', icon: List },
    { name: 'History', href: '/volunteer/history', icon: History },
    { name: 'Achievements', href: '/volunteer/achievements', icon: Award },
    { name: 'Profile', href: '/volunteer/profile', icon: User },
    { name: 'Settings', href: '/volunteer/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <span>Local Aid</span>
          </Link>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 mb-8 px-2">
            <Avatar>
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback>{(user as any)?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-medium truncate">{(user as any)?.name || 'Volunteer'}</p>
              <p className="text-xs text-muted-foreground truncate">{(user as any)?.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              // treat subroutes as active as well (e.g. /volunteer/opportunities/:id)
              const isActive =
                location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/'));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.name)}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-slate-50/50">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('Sign Out')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white px-4 flex items-center justify-between lg:justify-end sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default VolunteerLayout;
