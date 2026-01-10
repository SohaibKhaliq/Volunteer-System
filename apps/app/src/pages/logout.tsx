import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import api from '@/lib/api';
import LoadingSpinner from '@/components/atoms/loading-spinner';

const Logout = () => {
    const navigate = useNavigate();
    const { setToken, setUser } = useStore();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await api.logout();
            } catch (error) {
                // Ignore errors during logout
                console.error('Logout error:', error);
            } finally {
                setToken('');
                if (setUser) setUser(null); // Clear user if the store supports it, otherwise generic check

                // Clear any other local storage items if needed
                localStorage.removeItem('selectedOrganization');
                localStorage.removeItem('selectedOrganizationName');

                navigate('/login', { replace: true });
            }
        };

        performLogout();
    }, [navigate, setToken, setUser]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
        </div>
    );
};

export default Logout;
