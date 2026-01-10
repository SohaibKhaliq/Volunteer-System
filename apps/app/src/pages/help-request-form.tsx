import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/atoms/form';
import { useToast } from '@/components/atoms/use-toast';
import AddressInput from '@/components/molecules/address-input';
import AssistanceTypeInput from '@/components/molecules/assistance-type-input';
import FileInput from '@/components/molecules/file-input';
import MapInput from '@/components/molecules/map-input';
import Navbar from '@/components/molecules/navbar';
import RadioInput from '@/components/molecules/radio-input';
import TextAreaInput from '@/components/molecules/text-area-input';
import TextInput from '@/components/molecules/text-input';
import api from '@/lib/api';
import { EARTHQUAKE_EPICENTER } from '@/lib/config';
import { DetailTypes } from '@/lib/types';
import { imageSchema } from '@/lib/validation';
import { RequestTypes } from '@/types/types';
import { FixType } from '@/types/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import * as z from 'zod';

const formSchema = z.object({
  types: z.array(z.nativeEnum(RequestTypes)).nonempty(),
  location: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number()
  }),
  isOnSite: z.enum(['yes', 'no'] as const),
  description: z.string().nonempty(),
  source: z.string().nonempty(),
  name: z.string().nonempty(),
  email: z.string().email().optional(),
  phone: z.string().nonempty(),
  files: z.array(imageSchema).optional().default([]),
  severity: z.enum(['low', 'medium', 'high', 'critical'] as const),
  contactMethod: z.enum(['phone', 'email', 'sms', 'whatsapp'] as const),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'You must consent to proceed'
  }),
  metaData: z.any().optional()
});

const HelpRequestForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      types: [],
      location: {
        address: undefined,
        ...EARTHQUAKE_EPICENTER
      },
      isOnSite: 'no',
      description: '',
      source: '',
      name: '',
      email: undefined,
      phone: '',
      files: [],
      severity: 'medium',
      contactMethod: 'phone',
      consentGiven: false,
      metaData: {}
    },
    mode: 'onChange'
  });

  const navigate = useNavigate();

  const { isLoading, mutate: createHelpRequest } = useMutation({
    mutationFn: (formData: FormData) => api.createHelpRequest(formData),
    onSuccess: (data: FixType) => {
      toast({
        title: t('Help Request Created'),
        description: t('Your help request has been created successfully'),
        className: 'rounded-2xl border-primary/20 shadow-2xl'
      });

      timeout.current = setTimeout(() => {
        return navigate('/detail/' + DetailTypes.Request + '/' + data.id);
      }, 1000);
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Something went wrong, please try again later'),
        variant: 'destructive',
        className: 'rounded-2xl shadow-2xl'
      });
    }
  });

  const { isSubmitting, isDirty, isValid } = form.formState;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();

    formData.append('types', JSON.stringify(values.types));
    formData.append('location', JSON.stringify(values.location));
    formData.append('isOnSite', values.isOnSite);
    if (values.description) formData.append('description', values.description);
    if (values.source) formData.append('source', values.source);
    formData.append('name', values.name);
    if (values.email) formData.append('email', values.email);
    formData.append('phone', values.phone);

    // New Fields
    formData.append('severity', values.severity);
    formData.append('contactMethod', values.contactMethod);
    formData.append('consentGiven', String(values.consentGiven));
    formData.append('metaData', JSON.stringify(values.metaData || {}));

    values.files.forEach((file) => {
      formData.append('files', file);
    });

    return createHelpRequest(formData);
  };

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-primary pt-24 pb-48">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
        <div className="container relative px-4 mx-auto text-center">
          <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 mb-6 backdrop-blur-sm px-4 py-1.5 rounded-full">
            {t('Emergency Assistance')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            {t('Request Help')}
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            {t('Please provide details about your situation so we can coordinate the right assistance for you.')}
          </p>
        </div>
      </div>

      <div className="container px-4 mx-auto -mt-32 relative z-10">
        <div className="max-w-3xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" encType="multipart/form-data">
              {/* Section 1: Assistance & Location */}
              <Card className="border-border/50 shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="p-8 md:p-12 pb-0">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <MapInput.Icon className="h-6 w-6" /> {/* Placeholder icon if MapInput has one, otherwise use a direct one */}
                    </div>
                    <CardTitle className="text-2xl font-black">{t('Assistance & Location')}</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium pl-14">
                    {t('Tell us what you need and where you are located.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 md:p-12 space-y-10">
                  <FormField
                    control={form.control}
                    name="types"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <AssistanceTypeInput label={t('What are your needs?')} {...field} />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioInput
                            label={t('Severity Level')}
                            options={[
                              { label: t('Low - Need help but safe for now'), value: 'low' },
                              { label: t('Medium - Urgent but not life threatening'), value: 'medium' },
                              { label: t('High - Immediate assistance needed'), value: 'high' },
                              { label: t('Critical - Life threatening emergency'), value: 'critical' }
                            ]}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-8">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <AddressInput label={t('Address')} placeholder={t('Enter the full address')} {...field} />
                          </FormControl>
                          <FormMessage className="font-bold" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MapInput label={t('Pin point the exact location')} optional {...field} />
                          </FormControl>
                          <FormMessage className="font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isOnSite"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioInput
                            label={t('Are you currently at this location?')}
                            options={[
                              { label: t('Yes'), value: 'yes' },
                              { label: t('No'), value: 'no' }
                            ]}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section 2: Situation Details */}
              <Card className="border-border/50 shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="p-8 md:p-12 pb-0">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <TextAreaInput.Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-black">{t('Situation Details')}</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium pl-14">
                    {t('Provide more context to help our team understand the urgency.')}
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
                            label={t('Describe the situation')}
                            placeholder={t('Please provide as much detail as possible about what is happening...')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TextAreaInput
                            label={t('Source of information')}
                            placeholder={t('e.g., Self, Neighbor, Local News')}
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
                          <FileInput label={t('Upload photos (optional)')} optional {...field} />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section 3: Contact Information */}
              <Card className="border-border/50 shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="p-8 md:p-12 pb-0">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <TextInput.Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-black">{t('Contact Information')}</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium pl-14">
                    {t('How can we reach you or the person in need?')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 md:p-12 space-y-10">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TextInput
                            label={t('Contact Name')}
                            placeholder={t('Full Name')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-8 sm:grid-cols-2">
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
                              label={t('Email (Optional)')}
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

                  <FormField
                    control={form.control}
                    name="contactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioInput
                            label={t('Preferred Contact Method')}
                            options={[
                              { label: t('Phone Call'), value: 'phone' },
                              { label: t('SMS'), value: 'sms' },
                              { label: t('WhatsApp'), value: 'whatsapp' },
                              { label: t('Email'), value: 'email' }
                            ]}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consentGiven"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start space-x-4 p-6 rounded-2xl bg-muted/50 border border-border/50">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded-lg border-2 border-primary/20 text-primary focus:ring-primary/20 accent-primary mt-1"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-2 leading-none">
                            <label className="text-base font-bold leading-none text-foreground">
                              {t('Consent to Share Information')}
                            </label>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                              {t('I understand that this information will be shared with verified volunteers and emergency services to coordinate assistance.')}
                            </p>
                          </div>
                        </div>
                        <FormMessage className="font-bold" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={!isDirty || !isValid || isSubmitting || isLoading}
                  className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {(isSubmitting || isLoading) ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Submitting Request...')}
                    </div>
                  ) : t('Submit Help Request')}
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

export default HelpRequestForm;
