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
  const timeout = useRef<NodeJS.Timeout | null>(null);
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
        title: 'Help Request Created',
        description: 'Your help request has been created successfully',
        variant: 'success'
      });

      timeout.current = setTimeout(() => {
        return navigate('/detail/' + DetailTypes.Request + '/' + data.id);
      }, 1000);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Something went wrong, please try again later',
        variant: 'destructive'
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
    <div className="flex flex-col w-full min-h-screen bg-gray-50/50">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-32">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('Request Help')}</h1>
          <p className="mt-2 text-sm text-gray-500 max-w-lg">
            {t('Please provide details about your situation so we can coordinate the right assistance for you.')}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" encType="multipart/form-data">
            
            {/* Section 1: Assistance & Location */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-semibold text-gray-900">{t('Assistance & Location')}</h2>
              </div>
              
              <FormField
                control={form.control}
                name="types"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AssistanceTypeInput label={t('What are your needs?')} {...field} />
                    </FormControl>
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-1">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <AddressInput label={t('Address')} placeholder={t('Enter the full address')} {...field} />
                      </FormControl>
                      <FormMessage />
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
                      <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 2: Situation Details */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-semibold text-gray-900">{t('Situation Details')}</h2>
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextAreaInput
                        label={t('Describe the situation')}
                        placeholder={t('Please provide as much detail as possible about what is happening...')}
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 3: Contact Information */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-semibold text-gray-900">{t('Contact Information')}</h2>
              </div>

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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-2">
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
                      <FormMessage />
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
                      <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentGiven"
                render={({ field }) => (
                  <FormItem>
                     <div className="flex items-start space-x-2 pt-2">
                      <FormControl>
                        <input
                           type="checkbox"
                           className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                           checked={field.value}
                           onChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <label className="text-sm font-medium leading-none text-gray-700">
                          {t('I consent to sharing this information for emergency assistance purposes.')}
                        </label>
                        <p className="text-xs text-gray-500">
                          {t('Your data will be shared with verified volunteers and emergency services if necessary.')}
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Navbar asSubmit disabled={!isDirty || !isValid} loading={isSubmitting || isLoading} />
          </form>
        </Form>
      </div>
    </div>
  );
};

export default HelpRequestForm;
