import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/atoms/form';
import { toast } from '@/components/atoms/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, FileText, User } from 'lucide-react';
import FileInput from '@/components/molecules/file-input';
import Navbar from '@/components/molecules/navbar';
import NumberInput from '@/components/molecules/numper-input';
import TextAreaInput from '@/components/molecules/text-area-input';
import TextInput from '@/components/molecules/text-input';
import TransportInput from '@/components/molecules/transport-input';
import api from '@/lib/api';
import { DetailTypes } from '@/lib/types';
import { imageSchema } from '@/lib/validation';
import { FixType } from '@/types/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as z from 'zod';

const locationSchema = z.object({
  address: z.string(),
  lat: z.number(),
  lng: z.number()
});

const formSchema = z.object({
  transport: z.object({
    start: locationSchema,
    end: locationSchema
  }),
  date: z.string(),
  capacity: z.number().int().positive().optional(),
  description: z.string().nonempty(),
  name: z.string().nonempty(),
  email: z.string().email().optional(),
  phone: z.string().nonempty(),
  files: z.array(imageSchema).optional().default([]),
  storage: z.string().optional()
});

const TransportRequestForm = () => {
  const { t } = useTranslation();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transport: {
        start: {
          address: undefined,
          lat: 0,
          lng: 0
        },
        end: {
          address: undefined,
          lat: 0,
          lng: 0
        }
      },
      date: new Date().toString(),
      capacity: 1,
      description: '',
      name: '',
      email: undefined,
      phone: '',
      files: []
    },
    mode: 'onChange'
  });

  const { isSubmitting, isDirty, isValid } = form.formState;

  const { isLoading, mutate: createCarpoolingRequest } = useMutation({
    mutationFn: (formData: FormData) => api.createCarpooling(formData),
    onSuccess: (data: FixType) => {
      toast({
        title: t('Transport Request Submitted'),
        description: t('Your request has been submitted and is pending admin approval.'),
        className: 'rounded-2xl border-primary/20 shadow-2xl'
      });
      timeout.current = setTimeout(() => {
        return navigate('/detail/' + DetailTypes.RideOffer + '/' + data.id);
      }, 1000);
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Something went wrong'),
        variant: 'destructive',
        className: 'rounded-2xl shadow-2xl'
      });
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    //  'type','departure_longitude','departureLatitude','departureAddress','departureDate','arrivalLongitude','arrivalLatitude','arrivalAddress','arrivalDate','description','capacity','storageSpace','status',
    const formData = new FormData();
    formData.append('departureLongitude', String(values.transport.start.lng));
    formData.append('departureLatitude', String(values.transport.start.lat));
    formData.append('departureAddress', String(values.transport.start.address));

    formData.append('departureDate', values.date);

    formData.append('arrivalLongitude', String(values.transport.end.lng));
    formData.append('arrivalLatitude', String(values.transport.end.lat));
    formData.append('arrivalAddress', String(values.transport.end.address));

    formData.append('arrivalDate', values.date); // TODO add arrival date input field (optional)

    formData.append('capacity', String(values.capacity));
    if (values.storage) formData.append('storageSpace', values.storage);
    if (values.description) formData.append('description', values.description);
    formData.append('name', values.name);
    if (values.email) formData.append('email', values.email);
    formData.append('phone', values.phone);
    values.files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('type', 'request');

    return createCarpoolingRequest(formData);
  };
  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-slate-900 pt-24 pb-48">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" />
        <div className="container relative px-4 mx-auto text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 mb-6 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md">
            {t('Commuting Together')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">{t('Request Transport')}</h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            {t('Need a ride? Fill in the details below and find community-led transport.')}
          </p>
        </div>
      </div>

      <div className="container px-4 mx-auto -mt-32 relative z-10">
        <div className="max-w-3xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" encType="multipart/form-data">
              {/* Route & Journey */}
              <Card className="border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-xl bg-card overflow-hidden">
                <CardHeader className="p-8 md:p-12 pb-0">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <Map className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">{t('Route & Journey')}</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium pl-14 text-muted-foreground">
                    {t('Specify your starting point and destination.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 md:p-12 space-y-10">
                  <FormField
                    control={form.control}
                    name="transport"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TransportInput {...field} />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <TextInput
                              label={t('Departure Date & Time')}
                              placeholder={t('Select Date & Time')}
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="font-bold" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <NumberInput label={t('Requested Seats')} {...field} />
                          </FormControl>
                          <FormMessage className="font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="storage"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TextInput
                            label={t('Storage Requirements')}
                            placeholder={t('e.g. Space for 2 large suitcases')}
                            optional
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Description & Media */}
              <Card className="border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-xl bg-card overflow-hidden">
                <CardHeader className="p-8 md:p-12 pb-0">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">{t('Additional Details')}</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium pl-14 text-muted-foreground">
                    {t('Provide more context about your journey or any specific needs.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 md:p-12 space-y-10">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TextAreaInput
                            label={t('Trip Description')}
                            placeholder={t('Explain why you need transport and any other relevant information...')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="files"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileInput label={t('Upload Photos (Optional)')} {...field} optional />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-xl bg-card overflow-hidden">
                <CardHeader className="p-8 md:p-12 pb-0">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <User className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">{t('Contact Information')}</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium pl-14 text-muted-foreground">
                    {t('How can potential drivers reach you?')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 md:p-12 space-y-10">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TextInput label={t('Full Name')} placeholder={t('Enter your full name')} {...field} />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <TextInput
                              label={t('Phone Number')}
                              placeholder={t('e.g. +123...')}
                              type="tel"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="font-bold" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <TextInput
                              label={t('Email Address')}
                              type="email"
                              placeholder={t('example@email.com')}
                              optional
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={!isDirty || !isValid || isSubmitting || isLoading}
                  className="w-full h-16 rounded-lg text-lg font-bold shadow-2xl shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {isSubmitting || isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Submitting Request...')}
                    </div>
                  ) : (
                    t('Submit Transport Request')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:text-foreground"
                >
                  {t('Cancel and Go Back')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default TransportRequestForm;
