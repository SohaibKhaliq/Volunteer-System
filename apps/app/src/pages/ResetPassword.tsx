import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const t = params.get('token');
        if (!t) {
            toast.error(t('Invalid or missing reset token.'));
            navigate('/login');
        } else {
            setToken(t);
        }
    }, [location, navigate, t]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const mutation = useMutation((values: ResetPasswordValues) =>
        api.resetPassword({ token, password: values.password }),
        {
            onSuccess() {
                setIsSuccess(true);
                toast.success(t('Password reset successful! You can now log in with your new password.'));
            },
            onError(error: any) {
                toast.error(error?.response?.data?.error?.message || t('Unable to reset password. The link may have expired.'));
            },
        });

    const onSubmit = (data: ResetPasswordValues) => {
        mutation.mutate(data);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                            <ShieldCheck className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('Password Reset Successful')}</h1>
                        <p className="text-muted-foreground text-lg">
                            {t('Your password has been successfully updated. You can now use your new password to sign in.')}
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link to="/login">
                            <Button className="w-full h-12 shadow-lg shadow-primary/20">
                                {t('Sign In')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('Reset password')}</h1>
                        <p className="text-muted-foreground mt-3 text-lg font-medium">
                            {t('Please enter your new password below.')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="password"
                                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                            >
                                {t('New Password')}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                {...register('password')}
                                placeholder="••••••••"
                                className={`h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }`}
                            />
                            {errors.password && (
                                <p className="text-xs font-medium text-red-500 ml-1 italic">{t(errors.password.message!)}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="confirmPassword"
                                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                            >
                                {t('Confirm New Password')}
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword')}
                                placeholder="••••••••"
                                className={`h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }`}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs font-medium text-red-500 ml-1 italic">{t(errors.confirmPassword.message!)}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-md shadow-xl shadow-primary/20 font-bold text-lg"
                            disabled={mutation.isLoading}
                        >
                            {mutation.isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t('Resetting...')}
                                </>
                            ) : (
                                t('Reset Password')
                            )}
                        </Button>
                    </form>

                    <div className="pt-2 text-center">
                        <Link to="/login" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center group">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            {t('Back to sign in')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:block relative bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 mix-blend-multiply z-10" />
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px] z-10" />
                <img
                    src="https://images.unsplash.com/photo-1633265486231-22920248465d?q=80&w=2070&auto=format&fit=crop"
                    alt="Secure Shield"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
                <div className="relative h-full flex flex-col justify-end p-16 text-white z-20">
                    <div className="max-w-xl">
                        <div className="w-16 h-1 w-primary-foreground/30 mb-8 rounded-full" />
                        <blockquote className="space-y-6">
                            <p className="text-3xl font-bold leading-[1.3] tracking-tight italic">
                                {t(
                                    "“The advance of technology is based on making it fit in so that you don't even notice it, so it's part of everyday life.”"
                                )}
                            </p>
                            <footer className="flex items-center gap-4">
                                <div className="h-0.5 w-8 bg-primary-foreground/50" />
                                <span className="text-xl font-bold opacity-90">— Bill Gates</span>
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
    );
}
