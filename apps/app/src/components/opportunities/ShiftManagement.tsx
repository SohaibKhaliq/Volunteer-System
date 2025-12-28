import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

function parseApiDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    return new Date(raw.replace(' ', 'T') + 'Z');
  }
  return new Date(raw);
}

function getShiftStart(shift: any): Date | null {
  return parseApiDate(shift?.startAt ?? shift?.start_at);
}

function getShiftEnd(shift: any): Date | null {
  return parseApiDate(shift?.endAt ?? shift?.end_at);
}

const shiftSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_at: z.string().min(1, 'Start time is required'),
  end_at: z.string().min(1, 'End time is required'),
  capacity: z.coerce.number().min(0).optional()
});

type ShiftFormValues = z.infer<typeof shiftSchema>;

interface Shift {
  id: number;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  capacity?: number;
}

export function ShiftManagement({ opportunityId }: { opportunityId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch shifts
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts', opportunityId],
    queryFn: async () => {
      const res = await api.get(`/organization/opportunities/${opportunityId}/shifts`);
      return res.data as Shift[];
    },
    enabled: !!opportunityId
  });

  // Create shift mutation
  const createMutation = useMutation({
    mutationFn: async (values: ShiftFormValues) => {
      const res = await api.post(`/organization/opportunities/${opportunityId}/shifts`, values);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Shift created successfully');
      setIsOpen(false);
      queryClient.invalidateQueries(['shifts', opportunityId]);
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create shift');
    }
  });

  // Delete shift mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/organization/shifts/${id}`);
    },
    onSuccess: () => {
      toast.success('Shift deleted');
      queryClient.invalidateQueries(['shifts', opportunityId]);
    }
  });

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      title: '',
      description: '',
      capacity: 10
    }
  });

  const onSubmit = (values: ShiftFormValues) => {
    createMutation.mutate(values);
  };

  if (!opportunityId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Shifts</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Shift</DialogTitle>
              <DialogDescription>Create a shift for this opportunity.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Morning Shift" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start</FormLabel>
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isLoading}>
                    {createMutation.isLoading ? 'Creating...' : 'Create Shift'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading shifts...</div>
        ) : shifts?.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-dashed p-8 text-center rounded-lg">
            No shifts created yet.
          </div>
        ) : (
          shifts?.map((shift) => (
            <Card key={shift.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{shift.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {(() => {
                        const d = getShiftStart(shift);
                        return d ? format(d, 'MMM d, yyyy') : '—';
                      })()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(() => {
                        const start = getShiftStart(shift);
                        const end = getShiftEnd(shift);
                        if (!start || !end) return '—';
                        return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
                      })()}
                    </span>
                    {shift.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {shift.capacity} spots
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/90"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this shift?')) {
                      deleteMutation.mutate(shift.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
