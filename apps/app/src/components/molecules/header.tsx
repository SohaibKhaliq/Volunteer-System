import { cn } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
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
  const { authenticated, user } = useApp();
  const { theme } = useTheme();
  const { setToken, setUser } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
            <img src={theme === 'dark' ? '/logo-light.svg' : '/logo.svg'} alt="logo" className="h-8 w-auto" />
            <span className="text-xl font-bold hidden md:inline-block">Local Aid</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
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

          {authenticated ? (
            <div className="flex items-center gap-4">
              {user?.roles?.some((r: any) => r.name === 'admin') && (
                <Link
                  to="/admin"
                  className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Admin
                </Link>
              )}
              {(user?.roles?.some((r: any) => r.name === 'organization_admin' || r.name === 'organization_member') ||
                user?.organizationId) && (
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
                  <DropdownMenuItem onClick={() => navigate('/help-request')} className="cursor-pointer">
                    Request Help
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/help-offer')} className="cursor-pointer">
                    Offer Help
                  </DropdownMenuItem>
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
