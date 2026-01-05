import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, X } from 'lucide-react';

export default function AdminAchievements() {
  const queryClient = useQueryClient();
  const { data: list = [] } = useQuery(['achievements'], () => api.listAchievements(), {
    select: (d: any) => (Array.isArray(d) ? d : d?.data || [])
  });

  const [key, setKey] = useState('');
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Criteria Builder State
  const [ruleType, setRuleType] = useState('hours');
  const [threshold, setThreshold] = useState('');

  const resetForm = () => {
    setKey('');
    setTitle('');
    setRuleType('hours');
    setThreshold('');
    setEditingId(null);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createAchievement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['achievements']);
      toast({ title: 'Achievement created', variant: 'success' });
      resetForm();
    },
    onError: () => toast({ title: 'Failed to create achievement', variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.updateAchievement(editingId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['achievements']);
      toast({ title: 'Achievement updated', variant: 'success' });
      resetForm();
    },
    onError: () => toast({ title: 'Failed to update achievement', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAchievement(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['achievements']);
      toast({ title: 'Achievement deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to delete achievement', variant: 'destructive' })
  });

  const handleSave = () => {
    if (!key || !title || !threshold) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    const payload = {
      key,
      name: title,
      requirement: {
        type: ruleType,
        threshold: Number(threshold)
      },
      isActive: true
    };

    if (editingId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (a: any) => {
    setEditingId(a.id);
    setKey(a.key);
    setTitle(a.name || a.title);
    setRuleType(a.requirement?.type || 'hours');
    setThreshold(a.requirement?.threshold ? String(a.requirement.threshold) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Achievements</h2>
          <p className="text-muted-foreground">Create and manage global achievements and gamification rules</p>
        </div>
      </div>

      <Card className={editingId ? 'border-primary' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{editingId ? 'Edit Achievement' : 'Create New Achievement'}</CardTitle>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="mr-2 h-4 w-4" /> Cancel Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unique Key</Label>
                <Input
                  placeholder="e.g. veteran_status"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Internal identifier for the achievement.</p>
              </div>
              <div className="space-y-2">
                <Label>Display Title</Label>
                <Input
                  placeholder="e.g. Veteran Volunteer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Criteria Rule</Label>
              <div className="flex gap-4 items-start">
                <div className="w-[200px]">
                  <Select value={ruleType} onValueChange={setRuleType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Total Hours</SelectItem>
                      <SelectItem value="events">Events Attended</SelectItem>
                      <SelectItem value="recent_hours">Recent Hours (90d)</SelectItem>
                      <SelectItem value="combined_score">Impact Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-medium">must be at least</span>
                  <Input
                    type="number"
                    placeholder="50"
                    className="w-[100px]"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {ruleType === 'hours' && 'hours'}
                    {ruleType === 'events' && 'events'}
                    {ruleType === 'recent_hours' && 'hours'}
                    {ruleType === 'combined_score' && 'points'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingId
                  ? (updateMutation.isLoading ? 'Updating...' : 'Update Achievement')
                  : (createMutation.isLoading ? 'Creating...' : 'Create Achievement')
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Achievements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(list || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No achievements found.
                  </TableCell>
                </TableRow>
              ) : (
                (list || []).map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.key}</TableCell>
                    <TableCell className="font-medium">
                      {a.name || a.title || 'Untitled'}
                    </TableCell>
                    <TableCell>
                      {a.requirement?.type ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{a.requirement.type}</Badge>
                          <span className="text-sm">≥ {a.requirement.threshold}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">
                          {typeof a.requirement === 'object'
                            ? JSON.stringify(a.requirement)
                            : String(a.requirement || a.requirement_json || '-')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.isActive || a.is_active ? 'default' : 'secondary'}>
                        {a.isActive || a.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Delete this achievement?')) {
                              deleteMutation.mutate(a.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
