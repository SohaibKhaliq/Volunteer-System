import { cn } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { useTheme } from '@/providers/theme-provider';
import BackButton from '../atoms/back-button';
import Language from '../atoms/language';
import { Button } from '../ui/button';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import { showApiError } from '@/lib/error-to-toast';
import { toast } from '@/components/atoms/use-toast';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ReactComponent as CarIcon } from '@/assets/icons/car.svg';
import { ReactComponent as HandIcon } from '@/assets/icons/hand.svg';
import { ReactComponent as HomeIcon } from '@/assets/icons/home.svg';
import { ReactComponent as MapIcon } from '@/assets/icons/map.svg';
import { Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { showBackButton, authenticated, user } = useApp();
  const { theme } = useTheme();
  const { setToken } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/carpooling', icon: CarIcon, label: 'Carpooling' },
    { path: '/help', icon: HandIcon, label: 'Help' },
    { path: '/map', icon: MapIcon, label: 'Map' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton
            className={cn({
              'opacity-0': !showBackButton,
              hidden: !showBackButton
            })}
          />
          <Link to="/" className="flex items-center gap-2">
            <img src={theme === 'dark' ? '/logo-light.svg' : '/logo.svg'} alt="logo" className="h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                  location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{t(item.label)}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Create')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/help-request')}>{t('Request Help')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/help-offer')}>{t('Offer Help')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/transport-offer')}>{t('Offer Transport')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/transport-request')}>
                {t('Request Transport')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Language />

          {authenticated && (
            <>
              {user?.roles?.some((r: any) => r.name === 'admin') && (
                <Link to="/admin" className="text-sm font-medium hover:text-primary">
                  Admin Panel
                </Link>
              )}
              {/* Show Org Panel if user has org role or is part of an org (simplified check) */}
              {(user?.roles?.some((r: any) => r.name === 'organization_admin' || r.name === 'organization_member') || user?.organizationId) && (
                <Link to="/organization" className="text-sm font-medium hover:text-primary">
                  Organization Panel
                </Link>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="hidden sm:inline">{user?.firstName || 'Account'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-2 flex justify-around z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-md transition-colors',
              location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-[10px]">{t(item.label)}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
