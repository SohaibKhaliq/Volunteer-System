import { useState, FormEvent } from 'react';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building2 } from 'lucide-react';

export default function OrganizationRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  const mutation = useMutation((data: any) => api.register(data), {
    // Assuming same register endpoint or specific one
    onSuccess() {
      toast({ title: 'Application Submitted', description: 'Your organization registration is under review.' });
      navigate('/login');
    },
    onError(error: any) {
      toast({
        title: 'Registration failed',
        description: error?.response?.data?.error?.message || 'Something went wrong'
      });
    }
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Passwords do not match' });
      return;
    }
    // Add org specific flag or data structure if needed by backend
    mutation.mutate({
      ...formData,
      role: 'organization' // Assuming backend handles role assignment
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Register Organization</h1>
            <p className="text-muted-foreground mt-2">Partner with us to find volunteers and manage your events</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Green Earth Initiative"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@org.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+123..."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your mission..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={mutation.isLoading}>
              {mutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Visual */}
      <div className="hidden lg:block relative bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-slate-900/60 mix-blend-multiply" />
        <img
          src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop"
          alt="Teamwork"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/10 backdrop-blur rounded-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">For Non-Profits & NGOs</h3>
              <p className="text-white/80">Manage volunteers, events, and impact.</p>
            </div>
          </div>
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              "Alone we can do so little; together we can do so much."
            </p>
            <footer className="text-sm opacity-80">— Helen Keller</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
