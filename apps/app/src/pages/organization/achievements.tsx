import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';

export default function OrganizationAchievements() {
  const queryClient = useQueryClient();
  const { data: list = [] } = useQuery(['org-achievements'], () => api.listOrganizationAchievements(), {
    select: (d: any) => (Array.isArray(d) ? d : d?.data || [])
  });

  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createOrganizationAchievement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['org-achievements']);
      toast({ title: 'Achievement created', variant: 'success' });
      setTitle('');
      setCriteria('');
    },
    onError: () => toast({ title: 'Failed to create achievement', variant: 'destructive' })
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Organization Achievements</h2>
          <p className="text-muted-foreground">Create and manage organization-specific achievements</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            placeholder='criteria JSON e.g. {"type":"events","threshold":5}'
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
          />
        </div>
        <div className="flex justify-end mt-3">
          <Button
            onClick={() => createMutation.mutate({ title, criteria: criteria ? JSON.parse(criteria) : undefined })}
            disabled={!title}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Criteria</TableHead>
              <TableHead>Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(list || []).map((a: any) => (
              <TableRow key={a.id}>
                <TableCell>{a.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{JSON.stringify(a.criteria)}</TableCell>
                <TableCell>{a.is_enabled ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
