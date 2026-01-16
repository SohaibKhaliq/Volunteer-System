import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import LoadingSpinner from '@/components/atoms/loading-spinner';
import { CheckCircle2, XCircle } from 'lucide-react';

const VerifyEmail = () => {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    const hasVerified = useRef(false);

    useEffect(() => {
        const verify = async () => {
            if (!token || hasVerified.current) {
                return;
            }

            hasVerified.current = true;
            try {
                await api.verifyEmail(token);
                setStatus('success');
            } catch (error: any) {
                // If it's already verified or token is gone, but we haven't seen success yet, 
                // it might be a race condition from strict mode.
                setStatus('error');
                setMessage(error.response?.data?.error?.message || 'Verification failed. The link may be expired or invalid.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    {status === 'loading' && (
                        <>
                            <LoadingSpinner className="h-12 w-12 mx-auto text-blue-600" />
                            <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifying your email...</h2>
                            <p className="mt-2 text-sm text-gray-600">Please wait while we confirm your email address.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                            <h2 className="mt-6 text-2xl font-bold text-gray-900">Email Verified!</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Your email has been successfully verified. You can now access all features.
                            </p>
                            <div className="mt-6">
                                <Link
                                    to="/login"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="h-16 w-16 mx-auto text-red-500" />
                            <h2 className="mt-6 text-2xl font-bold text-gray-900">Verification Failed</h2>
                            <p className="mt-2 text-sm text-gray-600">{message}</p>
                            <div className="mt-6">
                                <Link
                                    to="/register"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Back to Registration
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
