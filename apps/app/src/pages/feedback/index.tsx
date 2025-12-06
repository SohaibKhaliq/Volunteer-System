import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
// toast handled via sonner in volunteer pages; not needed here
import { useApp } from '@/providers/app-provider';

export default function FeedbackDashboard() {
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

  // Mutations for admin management are provided in the admin area. On the volunteer-facing page
  // we only show available surveys to take, so these mutations are intentionally omitted here.

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
