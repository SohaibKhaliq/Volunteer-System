import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import api from '@/lib/api';
import LoadingSpinner from '@/components/atoms/loading-spinner';
import { useTranslation } from 'react-i18next';

const Logout = () => {
    const navigate = useNavigate();
    const { setToken, setUser } = useStore();
    const { t } = useTranslation();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await api.logout();
            } catch (error) {
                // Ignore errors during logout
                console.error('Logout error:', error);
            } finally {
                setToken('');
                if (setUser) setUser(null);

                localStorage.removeItem('selectedOrganization');
                localStorage.removeItem('selectedOrganizationName');

                // Add a small delay for a smooth transition
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 800);
            }
        };

        performLogout();
    }, [navigate, setToken, setUser]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5" />

            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                    <LoadingSpinner className="relative h-16 w-16 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-2xl font-black tracking-tight">{t?.('Signing out...')}</h2>
                    <p className="text-muted-foreground font-medium">{t?.('Preparing your safe departure')}</p>
                </div>
            </div>
        </div>
    );
};

export default Logout;
