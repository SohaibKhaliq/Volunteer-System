import { cn } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import useSystemRoles from '@/hooks/useSystemRoles';
import { useTheme } from '@/providers/theme-provider';
import Language from '../atoms/language';
import { Button } from '../ui/button';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import { showApiError } from '@/lib/error-to-toast';
import { toast } from '@/components/atoms/use-toast';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import NotificationBell from './notification-bell';
import DarkModeToggle from './dark-mode-toggle';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { authenticated, user, settings } = useApp();
  const { theme } = useTheme();
  const { setToken, setUser } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const { isPrivilegedUser, isOrganizationAdminUser } = useSystemRoles();
  const isAdmin = isPrivilegedUser(user);
  const isOrganization = isOrganizationAdminUser(user) || !!user?.organizationId;
  const isVolunteer = authenticated && !isAdmin && !isOrganization;
  const isPublicOrVolunteer = !isAdmin && !isOrganization;

  const logoutMutation = useMutation(api.logout, {
    onSuccess: () => {
      // Clear user state first
      setUser(null);

      // Invalidate queries to ensure fresh state
      queryClient.invalidateQueries(['me']);

      // Clear token last
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            {settings?.find((s: any) => s.key === 'logo_url')?.value ? (
              <img
                src={settings.find((s: any) => s.key === 'logo_url')?.value}
                alt="logo"
                className="h-8 w-auto object-contain"
              />
            ) : (
              <img src={theme === 'dark' ? '/logo-light.svg' : '/logo.svg'} alt="logo" className="h-8 w-auto" />
            )}
            <span className="text-xl font-bold hidden md:inline-block">
              {settings?.find((s: any) => s.key === 'platform_name')?.value || 'Local Aid'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {isPublicOrVolunteer && (
              <>
                <Link
                  to="/"
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {t('Home')}
                </Link>
                <Link
                  to="/map"
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    location.pathname === '/map' ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {t('Find Opportunities')}
                </Link>
                <Link
                  to="/organizations"
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    location.pathname === '/organizations' ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {t('Organizations')}
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'text-sm font-medium transition-colors',
                        location.pathname.includes('transport') || location.pathname.includes('help-')
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {t('Services')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/transport-request')} className="cursor-pointer">
                      {t('Request Transport')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/transport-offer')} className="cursor-pointer">
                      {t('Offer Transport')}
                    </DropdownMenuItem>
                    <div className="h-px bg-border my-1" />
                    <DropdownMenuItem onClick={() => navigate('/help-request')} className="cursor-pointer">
                      {t('Request Help')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/help-offer')} className="cursor-pointer">
                      {t('Offer Help')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <Link
              to="/about"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                location.pathname === '/about' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t('About')}
            </Link>
            <Link
              to="/help"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                location.pathname === '/help' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t('Help')}
            </Link>
            <Link
              to="/privacy"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                location.pathname === '/privacy' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t('Privacy')}
            </Link>
            <Link
              to="/terms"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                location.pathname === '/terms' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t('Terms')}
            </Link>
            <Link
              to="/contact"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                location.pathname === '/contact' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {t('Contact')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <Language />
          {/* Volunteer top-level menu to access consolidated volunteer sections */}
          {/* {isVolunteer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn('text-sm font-medium transition-colors')}>
                  Volunteer
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => navigate('/profile', { state: { scrollTo: 'overview' } })}
                  className="cursor-pointer"
                >
                  Overview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/profile', { state: { scrollTo: 'schedule' } })}
                  className="cursor-pointer"
                >
                  My Schedule
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/profile', { state: { scrollTo: 'history' } })}
                  className="cursor-pointer"
                >
                  History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/profile', { state: { scrollTo: 'achievements' } })}
                  className="cursor-pointer"
                >
                  Achievements
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/profile', { state: { scrollTo: 'settings' } })}
                  className="cursor-pointer"
                >
                  Settings
                </DropdownMenuItem>
                <div className="h-px bg-border my-1" />
                <DropdownMenuItem onClick={() => navigate('/volunteer/dashboard')} className="cursor-pointer">
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/volunteer/applications')} className="cursor-pointer">
                  My Applications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/volunteer/organizations')} className="cursor-pointer">
                  My Organizations
                </DropdownMenuItem>
                <div className="h-px bg-border my-1" />
                <DropdownMenuItem onClick={() => navigate('/map')} className="cursor-pointer">
                  Find Opportunities
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )} */}
          {authenticated ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Admin
                </Link>
              )}
              {isOrganization && (
                <Link
                  to="/organization"
                  className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Organization
                </Link>
              )}

              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                    <span className="hidden sm:inline-block font-medium">{user?.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    My Profile
                  </DropdownMenuItem>
                  {isVolunteer && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/help-request')} className="cursor-pointer">
                        Request Help
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/help-offer')} className="cursor-pointer">
                        Offer Help
                      </DropdownMenuItem>
                    </>
                  )}
                  <div className="h-px bg-border my-1" />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t('Log in')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">{t('Join Now')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
