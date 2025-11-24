// src/pages/admin/communications.tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Edit, Trash2, Plus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function AdminCommunications() {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [audienceType, setAudienceType] = useState<'all' | 'roles' | 'event' | 'emails'>('all');
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [customEmails, setCustomEmails] = useState<string>('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['communications'],
    queryFn: api.listCommunications
  });

  const communications = Array.isArray(data) ? data : [];

  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: api.listRoles });
  const roles = Array.isArray(rolesData) ? rolesData : [];
  const { data: eventsData } = useQuery({ queryKey: ['events'], queryFn: api.listEvents });
  const events = Array.isArray(eventsData) ? eventsData : [];

  const createMutation = useMutation({
    mutationFn: api.createCommunication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Communication created successfully');
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to create communication')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateCommunication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Communication updated successfully');
      setEditOpen(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to update communication')
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteCommunication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Communication deleted successfully');
      setDeleteOpen(false);
      setToDelete(null);
    },
    onError: () => toast.error('Failed to delete communication')
  });

  const saveCommunication = (payload: any) => {
    // compute targetAudience based on audience fields if present on payload
    const computed = { ...payload } as any;
    // if UI used `message`, map to `content`
    computed.content = payload.message ?? payload.content;
    delete computed.message;

    // prefer explicit audienceType state (controlled by UI) if present on payload
    const atype = payload.audienceType ?? audienceType;
    if (atype === 'all') {
      computed.targetAudience = 'all';
    } else if (atype === 'roles') {
      // send role names as JSON so backend can resolve
      computed.targetAudience = JSON.stringify({ roles: selectedRoles });
    } else if (atype === 'event') {
      if (selectedEventId) computed.targetAudience = JSON.stringify({ eventId: selectedEventId });
      else computed.targetAudience = null;
    } else if (atype === 'emails') {
      // save as comma separated string for backward compatibility
      computed.targetAudience = customEmails || '';
    }

    if (payload.id) {
      updateMutation.mutate({ id: payload.id, data: computed });
    } else {
      createMutation.mutate(computed);
    }
  };

  const confirmDelete = (id: number) => {
    setToDelete(id);
    setDeleteOpen(true);
  };

  const doDelete = () => {
    if (toDelete == null) return;
    deleteMutation.mutate(toDelete);
  };

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communications & Messages
            </CardTitle>
            <Button
              onClick={() => {
                setEditing(null);
                setAudienceType('all');
                setSelectedRoles([]);
                setSelectedEventId(null);
                setCustomEmails('');
                setEditOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Communication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : communications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No communications found
                  </TableCell>
                </TableRow>
              ) : (
                communications.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.subject}</TableCell>
                    <TableCell>{c.type || 'Email'}</TableCell>
                    <TableCell>{c.recipients || 'All Volunteers'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === 'Sent' ? 'default' : c.status === 'Scheduled' ? 'secondary' : 'outline'}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            try {
                              const res: any = await api.getCommunication(c.id);
                              const comm = res && res.data ? res.data : res;
                              setEditing({ ...comm, message: comm.content });
                              // parse existing targetAudience into UI state
                              const ta = comm.targetAudience;
                              if (!ta || ta === 'all') {
                                setAudienceType('all');
                                setSelectedRoles([]);
                                setSelectedEventId(null);
                                setCustomEmails('');
                              } else {
                                try {
                                  const parsed = JSON.parse(ta);
                                  if (parsed.roles && Array.isArray(parsed.roles)) {
                                    setAudienceType('roles');
                                    setSelectedRoles(parsed.roles);
                                    setSelectedEventId(null);
                                    setCustomEmails('');
                                  } else if (parsed.eventId) {
                                    setAudienceType('event');
                                    setSelectedEventId(parsed.eventId);
                                    setSelectedRoles([]);
                                    setCustomEmails('');
                                  } else {
                                    setAudienceType('emails');
                                    setCustomEmails(typeof ta === 'string' ? ta : '');
                                    setSelectedRoles([]);
                                    setSelectedEventId(null);
                                  }
                                } catch (err) {
                                  // fallback to comma-separated emails
                                  setAudienceType('emails');
                                  setCustomEmails(String(ta || ''));
                                  setSelectedRoles([]);
                                  setSelectedEventId(null);
                                }
                              }

                              setEditOpen(true);
                            } catch (e) {
                              toast.error('Failed to load communication');
                            }
                          }}
                          aria-label={`Edit ${c.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            try {
                              const res: any = await api.getCommunication(c.id);
                              const comm = res && res.data ? res.data : res;
                              setViewing(comm);
                              setViewOpen(true);
                            } catch (e) {
                              toast.error('Failed to load communication');
                            }
                          }}
                          aria-label={`View ${c.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => confirmDelete(c.id)} aria-label={`Delete ${c.id}`}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Communication</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-sm font-medium">Subject</div>
              <div className="mt-1">{viewing?.subject}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Content</div>
              <div className="mt-1 whitespace-pre-wrap">{viewing?.content}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-sm font-medium">Type</div>
                <div className="mt-1">{viewing?.type}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Status</div>
                <div className="mt-1">{viewing?.status}</div>
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Audience</label>
              <Select value={audienceType} onValueChange={(v) => setAudienceType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Volunteers</SelectItem>
                  <SelectItem value="roles">By Role</SelectItem>
                  <SelectItem value="event">Event Participants</SelectItem>
                  <SelectItem value="emails">Custom Emails</SelectItem>
                </SelectContent>
              </Select>

              {audienceType === 'roles' && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-muted-foreground">Select one or more roles:</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(roles || []).map((r: any) => (
                      <label key={r.id} className="inline-flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(r.name)}
                          onChange={(e) => {
                            const next = selectedRoles.includes(r.name)
                              ? selectedRoles.filter((s) => s !== r.name)
                              : [...selectedRoles, r.name];
                            setSelectedRoles(next);
                          }}
                        />
                        <span className="text-sm">{r.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {audienceType === 'event' && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">Select an event:</div>
                  <Select
                    value={selectedEventId ? String(selectedEventId) : undefined}
                    onValueChange={(v) => setSelectedEventId(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(events || []).map((ev: any) => (
                        <SelectItem key={ev.id} value={String(ev.id)}>
                          {ev.title || ev.name || `Event ${ev.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {audienceType === 'emails' && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">Enter comma-separated emails</div>
                  <Textarea value={customEmails} onChange={(e) => setCustomEmails(e.target.value)} rows={3} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / New Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-labelledby="comm-edit-title">
          <DialogHeader>
            <DialogTitle id="comm-edit-title">{editing?.id ? 'Edit Communication' : 'New Communication'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Subject</label>
              <Input
                value={editing?.subject || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Message</label>
              <Textarea
                rows={6}
                value={editing?.message || ''}
                onChange={(e) => setEditing((s: any) => ({ ...(s || {}), message: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm block mb-1">Type</label>
                <Select
                  value={editing?.type || 'Email'}
                  onValueChange={(v) => setEditing((s: any) => ({ ...(s || {}), type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm block mb-1">Status</label>
                <Select
                  value={editing?.status || 'Draft'}
                  onValueChange={(v) => setEditing((s: any) => ({ ...(s || {}), status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editing?.subject) {
                    toast.error('Subject is required');
                    return;
                  }
                  saveCommunication(editing || {});
                }}
              >
                {editing?.id ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent aria-labelledby="comm-delete-title">
          <DialogHeader>
            <DialogTitle id="comm-delete-title">Delete Communication</DialogTitle>
          </DialogHeader>
          <div className="p-4">Are you sure you want to delete this communication?</div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={doDelete}>
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
