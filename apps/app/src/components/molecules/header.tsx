import { cn } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { useTheme } from '@/providers/theme-provider';
import BackButton from '../atoms/back-button';
import Language from '../atoms/language';
import { Button } from '../ui/button';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { showBackButton, authenticated } = useApp();
  const { theme } = useTheme();
  const { setToken } = useStore();
  const navigate = useNavigate();

  const logoutMutation = useMutation(api.logout, {
    onSuccess: () => {
      setToken('');
      navigate('/login');
    }
  });

  return (
    <header className="flex justify-between w-full p-6 rtl:flex-row-reverse items-center">
      <div className="flex items-center gap-2">
        <BackButton
          className={cn({
            'opacity-0': !showBackButton
          })}
        />
      </div>
      
      <img src={theme === 'dark' ? '/logo-light.svg' : 'logo.svg'} alt="logo" className="object-cover h-10" />
      
      <div className="flex items-center gap-2">
        {authenticated && (
          <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        )}
        <Language />
      </div>
    </header>
  );
};

export default Header;
