// src/pages/admin/audit-logs.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ListOrdered } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { format } from 'date-fns';

export default function AdminAuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.listAuditLogs()
  });

  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getLog = useMutation((id: number) => api.getAuditLog(id), {
    onSuccess: (res: any) => {
      setSelectedLog(res && res.data ? res.data : res);
      setShowDetails(true);
    }
  });

  const logs = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      {log.user?.firstName} {log.user?.lastName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.ipAddress || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(log.createdAt), 'PPpp')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => getLog.mutate(log.id)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Details dialog */}
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Audit detail</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                {getLog.isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : selectedLog ? (
                  <div className="space-y-2 text-sm">
                    <div className="font-semibold">{selectedLog.action}</div>
                    <div className="text-xs text-muted-foreground">
                      User: {selectedLog.user?.firstName} {selectedLog.user?.lastName}
                    </div>
                    <pre className="bg-slate-50 p-3 rounded max-h-64 overflow-auto text-xs">{selectedLog.details}</pre>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No details</div>
                )}
              </div>
              <DialogFooter>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
