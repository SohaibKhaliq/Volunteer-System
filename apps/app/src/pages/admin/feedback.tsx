// src/pages/admin/feedback.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { toast } from 'sonner';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function AdminFeedback() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newSurvey, setNewSurvey] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: api.listSurveys
  });

  const surveys = Array.isArray(data) ? data : [];

  const createMutation = useMutation({
    mutationFn: api.createSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Survey created successfully');
      setCreateOpen(false);
      setNewSurvey({});
    },
    onError: () => toast.error('Failed to create survey')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateSurvey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Survey updated successfully');
    },
    onError: () => toast.error('Failed to update survey')
  });

  const handleToggleStatus = (survey: any) => {
    const newStatus = survey.status === 'Open' ? 'Closed' : 'Open';
    updateMutation.mutate({ id: survey.id, data: { ...survey, status: newStatus } });
  };

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Feedback & Surveys
            </CardTitle>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Survey
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : surveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No surveys found
                  </TableCell>
                </TableRow>
              ) : (
                surveys.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.responses?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "Open" ? "secondary" : "default"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(s)}>
                          {s.status === 'Open' ? 'Close' : 'Reopen'}
                        </Button>
                        <Button variant="outline" size="sm">
                          View Results
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

      {/* Create Survey Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Survey</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Title</label>
              <Input
                value={newSurvey.title || ''}
                onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Description</label>
              <Input
                value={newSurvey.description || ''}
                onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <Select
                value={newSurvey.status || 'Open'}
                onValueChange={(v) => setNewSurvey({ ...newSurvey, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newSurvey.title) {
                  toast.error('Title is required');
                  return;
                }
                createMutation.mutate(newSurvey);
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
