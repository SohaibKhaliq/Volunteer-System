import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Schema
const opportunitySchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  start_at: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  end_at: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid end date'),
  capacity: z.coerce.number().min(0),
  type: z.string().default('event'),
  status: z.string().default('draft'),
  visibility: z.string().default('public'),
})

type OpportunityFormValues = z.infer<typeof opportunitySchema>

export default function OrganizationOpportunityEdit() {
  const { id } = useParams()
  const isEdit = id && id !== 'create'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      capacity: 0,
      type: 'event',
      status: 'draft',
      visibility: 'public',
      start_at: '',
      end_at: '',
    }
  })

  // Fetch data if editing
  const { data: opportunity, isLoading } = useQuery({
    queryKey: ['opportunity-edit', id],
    queryFn: async () => {
      if (!isEdit) return null
      const res = await api.get(`/organization/opportunities/${id}`)
      return res.data
    },
    enabled: !!isEdit
  })

  // Populate form
  useEffect(() => {
    if (opportunity) {
      form.reset({
        title: opportunity.title,
        description: opportunity.description || '',
        location: opportunity.location || '',
        capacity: opportunity.capacity || 0,
        type: opportunity.type || 'event',
        status: opportunity.status || 'draft',
        visibility: opportunity.visibility || 'public',
        // Dates need to be in 'YYYY-MM-DDTHH:mm' format for datetime-local input potentially
        // But let's assume standard ISO string works if we use a date picker component or simple input
        start_at: opportunity.startAt ? new Date(opportunity.startAt).toISOString().slice(0, 16) : '',
        end_at: opportunity.endAt ? new Date(opportunity.endAt).toISOString().slice(0, 16) : '',
      })
    }
  }, [opportunity, form])

  const mutation = useMutation({
    mutationFn: async (values: OpportunityFormValues) => {
      if (isEdit) {
        return api.put(`/organization/opportunities/${id}`, values)
      } else {
        return api.post('/organization/opportunities', values)
      }
    },
    onSuccess: () => {
      toast.success(`Opportunity ${isEdit ? 'updated' : 'created'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['org-opportunities'] })
      navigate('/organization/opportunities')
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to save opportunity')
    }
  })

  const onSubmit = (values: OpportunityFormValues) => {
    mutation.mutate(values)
  }

  if (isEdit && isLoading) {
     return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
       <Card>
          <CardHeader>
              <CardTitle>{isEdit ? 'Edit Opportunity' : 'Create Opportunity'}</CardTitle>
          </CardHeader>
          <CardContent>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Beach Cleanup" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the event, tasks involved..." {...field} rows={5} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="start_at"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel>Start Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="end_at"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel>End Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="Address or Online Link" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="capacity"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel>Capacity</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" placeholder="0 for unlimited" {...field} />
                                </FormControl>
                                <FormDescription>Enter 0 for unlimited spots.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="type"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="shift">Shift</SelectItem>
                                    <SelectItem value="recurring">Recurring</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                         <FormField
                            control={form.control}
                            name="visibility"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel>Visibility</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select visibility" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="org-only">Organization Members Only</SelectItem>
                                    <SelectItem value="invite-only">Invite Only</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>

                      <div className="flex justify-end gap-4 pt-4">
                          <Button variant="outline" type="button" onClick={() => navigate('/organization/opportunities')}>
                              Cancel
                          </Button>
                          <Button type="submit" disabled={mutation.isPending}>
                              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isEdit ? 'Save Changes' : 'Create Opportunity'}
                          </Button>
                      </div>

                  </form>
              </Form>
          </CardContent>
       </Card>
    </div>
  )
}
