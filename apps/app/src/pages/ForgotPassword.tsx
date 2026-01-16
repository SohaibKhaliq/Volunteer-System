import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
    const { t } = useTranslation();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const mutation = useMutation((data: ForgotPasswordValues) => api.forgotPassword(data.email), {
        onSuccess() {
            setIsSubmitted(true);
            toast.success(t('If your email is registered, you will receive a reset link shortly.'));
        },
        onError(error: any) {
            toast.error(error?.response?.data?.error?.message || t('Something went wrong. Please try again.'));
        },
    });

    const onSubmit = (data: ForgotPasswordValues) => {
        mutation.mutate(data);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <MailCheck className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('Check your email')}</h1>
                        <p className="text-muted-foreground text-lg">
                            {t('We have sent a password reset link to your email address.')}
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link to="/login">
                            <Button variant="outline" className="w-full h-12">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('Back to sign in')}
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
            <div className="flex items-center justify-center p-8 bg-background text-foreground">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-6 group"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            {t('Back to sign in')}
                        </Link>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('Forgot password?')}</h1>
                        <p className="text-muted-foreground mt-3 text-lg font-medium">
                            {t("No worries, we'll send you reset instructions.")}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                            >
                                {t('Email')}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="name@example.com"
                                className={`h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }`}
                            />
                            {errors.email && (
                                <p className="text-xs font-medium text-red-500 ml-1 italic">{t(errors.email.message!)}</p>
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
                                    {t('Sending...')}
                                </>
                            ) : (
                                t('Reset Password')
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:block relative bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 mix-blend-multiply z-10" />
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px] z-10" />
                <img
                    src="https://images.unsplash.com/photo-1579389083078-4e7018379f7e?q=80&w=2070&auto=format&fit=crop"
                    alt="Security and Recovery"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
                <div className="relative h-full flex flex-col justify-end p-16 text-white z-20">
                    <div className="max-w-xl">
                        <div className="w-16 h-1 w-primary-foreground/30 mb-8 rounded-full" />
                        <blockquote className="space-y-6">
                            <p className="text-3xl font-bold leading-[1.3] tracking-tight italic">
                                {t(
                                    "“Security is not a product, but a process.”"
                                )}
                            </p>
                            <footer className="flex items-center gap-4">
                                <div className="h-0.5 w-8 bg-primary-foreground/50" />
                                <span className="text-xl font-bold opacity-90">— Bruce Schneier</span>
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
    );
}
