import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QRCodeSVG } from 'qrcode.react';

export default function OrganizationEventsManager() {
  const { data: events, isLoading } = useQuery(['org-events'], () => api.listOrganizationEvents());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showQr, setShowQr] = useState(false);

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      <div className="grid gap-6">
        {events?.map((event: any) => (
          <Card key={event.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription>{new Date(event.startAt).toLocaleDateString()} • {event.location}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setShowQr(true); }}>
                  <QrCode className="h-4 w-4 mr-2" /> Check-in QR
                </Button>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </CardHeader>
            <CardContent>
               <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Shifts (Tasks)</h3>
                  {event.tasks?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No shifts created.</p>
                  ) : (
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {event.tasks?.map((task: any) => (
                                <TableRow key={task.id}>
                                    <TableCell>{task.title}</TableCell>
                                    <TableCell>{new Date(task.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                                    <TableCell>{task.assignments?.length || 0} / {task.slotCount || task.capacity || 0}</TableCell>
                                    <TableCell><Badge variant="outline">{task.status || 'Active'}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                  )}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Event Check-in QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            {selectedEvent && (
                <>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                         <QRCodeSVG
                            value={JSON.stringify({
                                type: 'event_check_in',
                                eventId: selectedEvent.id,
                                title: selectedEvent.title
                            })}
                            size={200}
                        />
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold">{selectedEvent.title}</h3>
                        <p className="text-sm text-muted-foreground">Scan with the Eghata app to check in</p>
                    </div>
                </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
