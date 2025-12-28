import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function OrganizationAchievements() {
  const queryClient = useQueryClient();
  const { data: list = [] } = useQuery(['org-achievements'], () => api.listOrganizationAchievements(), {
    select: (d: any) => (Array.isArray(d) ? d : d?.data || [])
  });

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [ruleType, setRuleType] = useState('hours');
  const [threshold, setThreshold] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createOrganizationAchievement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['org-achievements']);
      toast({ title: 'Achievement created', variant: 'success' as any });
      setTitle('');
      setDesc('');
      setThreshold('');
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

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h3 className="font-semibold text-lg">Create New Achievement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="e.g. Super Volunteer" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Rule Type</Label>
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Hours Based</SelectItem>
                <SelectItem value="events">Events Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{ruleType === 'hours' ? 'Required Hours' : 'Required Events'}</Label>
            <Input
              type="number"
              placeholder={ruleType === 'hours' ? 'e.g. 50' : 'e.g. 10'}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe this achievement..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => {
              const criteria = {
                type: ruleType,
                threshold: Number(threshold)
              };
              // Generate simple key
              const key = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

              createMutation.mutate({
                title,
                key,
                description: desc,
                ruleType,
                criteria,
                points: 10 // default points
              });
            }}
            disabled={!title || !threshold}
          >
            {createMutation.isLoading ? 'Creating...' : 'Create Achievement'}
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
