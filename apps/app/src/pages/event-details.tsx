import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, Users, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';
import { useStore } from '@/lib/store';

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const [selectedShift, setSelectedShift] = useState<number | null>(null);

  const { data: event, isLoading } = useQuery(['event', id], () => api.getEvent(id!), {
    enabled: !!id
  });

  const applyMutation = useMutation((taskId: number) => api.createAssignment({ task_id: taskId, user_id: user?.id }), {
    onSuccess: () => {
      toast({ title: 'Application Submitted', description: 'You have successfully applied for this shift.' });
    },
    onError: (err: any) => {
        toast({ title: 'Application Failed', description: err.response?.data?.message || 'Could not apply.' });
    }
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  const data = event?.data || event; // handle wrapper

  if (!data) return (
    <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate('/events')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Button>
        <div className="p-12 text-center">Event not found</div>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate('/events')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">{data.title}</h1>
                            <CardDescription className="flex items-center mt-2 text-lg">
                                <MapPin className="h-4 w-4 mr-2" /> {data.location}
                            </CardDescription>
                        </div>
                        <Badge>{data.isRecurring ? 'Recurring' : 'One-time'}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose max-w-none">
                        <h3 className="text-lg font-semibold">About this event</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{data.description}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3">Available Shifts</h3>
                        {data.tasks?.length === 0 ? (
                            <p className="text-muted-foreground">No specific shifts listed.</p>
                        ) : (
                            <div className="space-y-3">
                                {data.tasks?.map((task: any) => (
                                    <div key={task.id} className={`border rounded-lg p-4 flex justify-between items-center ${selectedShift === task.id ? 'border-primary bg-primary/5' : ''}`}>
                                        <div>
                                            <div className="font-medium">{task.title}</div>
                                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {new Date(task.startAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={applyMutation.isLoading}
                                            onClick={() => applyMutation.mutate(task.id)}
                                        >
                                            {applyMutation.isLoading && selectedShift === task.id ? <Loader2 className="animate-spin h-3 w-3" /> : 'Apply'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Organization</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold mb-2">{data.organization?.name || 'Organization Name'}</div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Dedicated to making a difference in the community.
                    </p>
                    <Button variant="outline" className="w-full">Contact Organization</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
