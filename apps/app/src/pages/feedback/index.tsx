import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { useApp } from '@/providers/app-provider';

export default function FeedbackDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: surveys = [] } = useQuery(['surveys'], () => api.listSurveys());
  const { user } = useApp();
  const isAdmin = !!(
    user?.isAdmin ||
    user?.is_admin ||
    (user?.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: any) => {
        const n = (r?.name || r?.role || '').toLowerCase();
        return n === 'admin' || n === 'organization_admin' || n === 'organization_manager';
      }))
  );

  useEffect(() => {
    if (isAdmin) {
      // Redirect admins to the admin dashboard where full management lives
      navigate('/admin/feedback');
    }
  }, [isAdmin]);

  const publishMutation = useMutation((id: number) => api.updateSurvey(id, { status: 'Open' }), {
    onSuccess: () => queryClient.invalidateQueries(['surveys']),
    onError: () => toast.error('Failed to publish')
  });

  const closeMutation = useMutation((id: number) => api.updateSurvey(id, { status: 'Closed' }), {
    onSuccess: () => queryClient.invalidateQueries(['surveys']),
    onError: () => toast.error('Failed to close')
  });

  const duplicateMutation = useMutation(
    async (s: any) => api.createSurvey({ ...s, title: `${s.title} (Copy)`, status: 'Draft' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['surveys']);
        toast.success('Survey duplicated');
      },
      onError: () => toast.error('Failed to duplicate')
    }
  );

  const archiveMutation = useMutation((id: number) => api.deleteSurvey(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['surveys']);
      toast.success('Survey archived');
    },
    onError: () => toast.error('Failed to archive')
  });

  return (
    <div className="space-y-6">
      {/* Volunteer-facing list: only show open surveys and a Take button */}
      <Card>
        <CardHeader>
          <CardTitle>Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(surveys) ? surveys.filter((s: any) => (s.status || 'Draft') === 'Open') : []).map(
                (s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{(s.responses && s.responses.length) || 0}</TableCell>
                    <TableCell>{s.status ?? 'Draft'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button onClick={() => navigate(`/feedback/${s.id}/take`)}>Take</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
