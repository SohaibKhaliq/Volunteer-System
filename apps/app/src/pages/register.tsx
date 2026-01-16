import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must include uppercase, lowercase, and a number'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { t } = useTranslation();
  const { setToken, setUser } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation((data: RegisterFormValues) => api.register(data), {
    onSuccess(data) {
      const token = (data as any)?.token?.token;
      if (token) {
        setToken(token);
        const userData = (data as any)?.user;
        if (userData) {
          setUser(userData);
        }
        queryClient.invalidateQueries(['me']);
        toast.success(t('Account created! Welcome to Local Aid.'));
        navigate('/');
      } else {
        toast.success(t('Account created! Please check your email to verify your account.'));
        navigate('/login');
      }
    },
    onError(error: any) {
      const backendErrors = error?.response?.data?.error?.details?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err: any) => {
          if (err.field && err.message) {
            setError(err.field as any, {
              type: 'manual',
              message: err.rule === 'unique' ? t('This email is already registered') : t(err.message),
            });
          }
        });
        toast.error(t('Please fix the errors in the form.'));
      } else {
        toast.error(error?.response?.data?.error?.message || t('Registration failed. Please try again.'));
      }
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('Create an account')}</h1>
            <p className="text-muted-foreground mt-3 text-lg font-medium">
              {t('Join our community of volunteers today')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                >
                  {t('First name')}
                </Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="John"
                  className={`h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all ${errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''
                    }`}
                />
                {errors.firstName && (
                  <p className="text-xs font-medium text-red-500 ml-1 italic">{t(errors.firstName.message!)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
                >
                  {t('Last name')}
                </Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Doe"
                  className={`h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all ${errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''
                    }`}
                />
                {errors.lastName && (
                  <p className="text-xs font-medium text-red-500 ml-1 italic">{t(errors.lastName.message!)}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
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

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                {t('Password')}
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder={t('Create a password')}
                className={`h-12 bg-slate-50 dark:bg-slate-900 border-border/50 rounded-lg focus:bg-background transition-all ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
              />
              {errors.password ? (
                <p className="text-xs font-medium text-red-500 ml-1 italic">{t(errors.password.message!)}</p>
              ) : (
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  {t('Must be at least 8 characters long')}
                </p>
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
                  {t('Creating account...')}
                </>
              ) : (
                t('Create Account')
              )}
            </Button>
          </form>

          <div className="text-center text-sm font-medium">
            {t('Already have an account?')}{' '}
            <Link to="/login" className="font-bold text-primary hover:underline underline-offset-4 decoration-2">
              {t('Sign in')}
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Visual */}
      <div className="hidden lg:block relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px] z-10" />
        <img
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop"
          alt="Community support"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="relative h-full flex flex-col justify-end p-16 text-white z-20">
          <div className="max-w-xl">
            <div className="w-16 h-1 w-primary-foreground/30 mb-8 rounded-full" />
            <blockquote className="space-y-6">
              <p className="text-3xl font-bold leading-[1.3] tracking-tight italic">
                {t('“The best way to find yourself is to lose yourself in the service of others.”')}
              </p>
              <footer className="flex items-center gap-4">
                <div className="h-0.5 w-8 bg-primary-foreground/50" />
                <span className="text-xl font-bold opacity-90">— Mahatma Gandhi</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
