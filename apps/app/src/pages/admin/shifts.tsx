import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useApp } from '@/providers/app-provider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
import { Command, CommandGroup, CommandInput, CommandItem } from '@/components/atoms/command';

export default function AdminShifts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: shiftsRaw, isLoading } = useQuery(['shifts', search], () => api.listShifts({ search }));

  const shifts: any[] = Array.isArray(shiftsRaw) ? shiftsRaw : (shiftsRaw?.data ?? []);

  const deleteMutation = useMutation({
    mutationFn: api.deleteShift,
    onSuccess: () => queryClient.invalidateQueries(['shifts'])
  });

  // Quick assign volunteer
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignShift, setAssignShift] = React.useState<any | null>(null);
  const [userQuery, setUserQuery] = React.useState('');
  const [debouncedUserQuery, setDebouncedUserQuery] = React.useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserQuery(userQuery), 250);
    return () => clearTimeout(t);
  }, [userQuery]);

  const { data: orgProfile } = useQuery(['organization-profile'], () => api.getOrganizationProfile(), {
    staleTime: 1000 * 60 * 5
  });

  const { data: possibleUsersRaw = [] } = useQuery(
    ['organization-volunteers', orgProfile?.data?.id ?? orgProfile?.id, debouncedUserQuery],
    async () => {
      if (!orgProfile) return [] as const;
      const orgId = orgProfile?.data?.id ?? orgProfile?.id;
      const res = await api.getOrganizationVolunteers(orgId, { search: debouncedUserQuery });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [] as const;
    },
    { enabled: !!orgProfile }
  );

  const possibleUsers: any[] = Array.isArray(possibleUsersRaw) ? possibleUsersRaw : (possibleUsersRaw?.data ?? []);

  const assignMutation = useMutation({
    mutationFn: (data: any) => api.assignToShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('Volunteer assigned');
      setAssignOpen(false);
      setAssignShift(null);
      setUserQuery('');
    },
    onError: () => toast.error('Failed to assign volunteer')
  });

  const { user } = useApp();
  const canQuickAssign = !!(
    user?.isAdmin ||
    user?.is_admin ||
    (user?.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: any) => {
        const n = (r?.name || r?.role || '').toLowerCase();
        return n === 'admin' || n === 'organization_admin' || n === 'organization_manager';
      }))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search shifts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <div className="ml-auto">
              <Button onClick={() => (window.location.href = '/admin/shifts/new')}>
                <Plus className="h-4 w-4 mr-2" /> New Shift
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.event?.name ?? s.event?.title ?? '—'}</TableCell>
                    <TableCell>{s.start_at ?? s.startAt ?? ''}</TableCell>
                    <TableCell>{s.end_at ?? s.endAt ?? ''}</TableCell>
                    <TableCell>{s.capacity ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canQuickAssign && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAssignShift(s);
                              setAssignOpen(true);
                            }}
                          >
                            Quick Assign
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => (window.location.href = `/admin/shifts/${s.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(s.id)}>
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

      {canQuickAssign && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent aria-labelledby="assign-volunteer-title">
            <DialogHeader>
              <DialogTitle id="assign-volunteer-title">Quick Assign Volunteer</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Shift</div>
                <div className="font-medium">{assignShift?.title ?? '—'}</div>
              </div>
              <div>
                <label className="text-sm block mb-1">Search volunteer</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {userQuery || 'Search users...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search users..."
                        value={userQuery}
                        onValueChange={(v) => setUserQuery(v)}
                      />
                      <CommandGroup>
                        {possibleUsers.map((u: any) => (
                          <CommandItem
                            key={u.id}
                            onSelect={() => {
                              setUserQuery(`${u.firstName ?? u.name} ${u.lastName ?? ''}`);
                              // immediately assign
                              if (assignShift) assignMutation.mutate({ shift_id: assignShift.id, user_id: u.id });
                            }}
                          >
                            {u.firstName ?? u.name} {u.lastName ?? ''} {u.email ? `(${u.email})` : ''}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAssignOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
