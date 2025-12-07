import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import useAdminPendingHoursByOrg from '@/hooks/useAdminPendingHoursByOrg';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useNavigate } from 'react-router-dom';

export default function AdminPendingHoursByOrg() {
  const { data, isLoading } = useAdminPendingHoursByOrg();
  const [auditPage, setAuditPage] = useState(1);
  const [auditPerPage, setAuditPerPage] = useState(20);
  const [auditQuery, setAuditQuery] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [showAuditDetails, setShowAuditDetails] = useState(false);

  const { data: auditData, isLoading: auditLoading } = useQuery(
    ['admin', 'audit-logs', auditPage, auditPerPage, auditQuery],
    () => api.listAuditLogs({ page: auditPage, limit: auditPerPage, q: auditQuery }),
    { keepPreviousData: true, staleTime: 60_000 }
  );
  const navigate = useNavigate();
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    (p: { id: number; status: string }) => api.updateHour(p.id, { status: p.status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin', 'pending-hours', 'orgs']);
        queryClient.invalidateQueries(['admin', 'summary']);
        toast.success('Updated');
      },
      onError: () => toast.error('Action failed')
    }
  );

  const bulkMutation = useMutation((ids: number[]) => api.bulkUpdateHours(ids, 'Approved'), {
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'pending-hours', 'orgs']);
      queryClient.invalidateQueries(['admin', 'summary']);
      toast.success('Bulk approved');
    },
    onError: () => toast.error('Bulk action failed')
  });

  if (isLoading)
    return (
      <div className="p-4">
        <SkeletonCard />
      </div>
    );

  const groups: any[] = Array.isArray(data) ? data : [];
  const auditLogs: any[] = Array.isArray(auditData) ? auditData : (auditData?.data ?? []);
  const auditMeta: any = auditData && !Array.isArray(auditData) ? (auditData?.meta ?? auditData?.pagination ?? null) : null;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Pending Hours — By Organization</h3>
        <div className="text-sm text-muted-foreground">Orgs: {groups.length}</div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-6">No pending hours found across organizations</CardContent>
        </Card>
      ) : (
        groups.map((g) => (
          <Card key={g.organizationId} className="space-y-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="font-semibold">{g.organizationName}</div>
                  <Badge variant="secondary">{g.pendingCount}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => navigate(`/admin/organizations/${g.organizationId}`)}>
                    Open Org
                  </Button>
                  <Button
                    size="sm"
                    variant={expandedOrg === g.organizationId ? 'ghost' : 'outline'}
                    onClick={() => setExpandedOrg(expandedOrg === g.organizationId ? null : g.organizationId)}
                  >
                    {expandedOrg === g.organizationId ? 'Collapse' : 'Show sample entries'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expandedOrg === g.organizationId ? (
                <div className="space-y-2">
                  {Array.isArray(g.items) && g.items.length > 0 ? (
                    g.items.map((i: any) => (
                      <div key={i.id} className="p-3 border rounded flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">
                            {i.first_name} {i.last_name} — {i.event_title ?? 'N/A'}
                          </div>

                
                          <div className="text-xs text-muted-foreground">
                            {new Date(i.date).toLocaleDateString()} • {i.hours} hours
                          </div>
                          <div className="text-xs text-muted-foreground">{i.notes || ''}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: i.id, status: 'Approved' })}
                            disabled={updateMutation.isLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateMutation.mutate({ id: i.id, status: 'Rejected' })}
                            disabled={updateMutation.isLoading}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No sample items</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Click "Show sample entries" to view recent pending logs
                </div>
              )}
            </CardContent>
            {/* show recent audit logs related to this org */}
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Recent admin activity for this org</div>
                <div className="flex items-center gap-2">
                  <input
                    placeholder="Filter (action or details)"
                    value={auditQuery}
                    onChange={(e) => setAuditQuery(e.target.value)}
                    className="px-2 py-1 border rounded text-xs"
                  />
                  <select
                    value={auditPerPage}
                    onChange={(e) => setAuditPerPage(Number(e.target.value))}
                    className="px-2 py-1 border rounded text-xs"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {auditLoading ? (
                <div className="text-sm text-muted-foreground">Loading activity…</div>
              ) : (
                auditLogs
                .map((l: any) => {
                  try {
                    return { ...l, parsed: JSON.parse(l.details || '{}') };
                  } catch {
                    return { ...l, parsed: {} };
                  }
                })
                .filter((l: any) => {
                  const d = l.parsed || {};
                  return (
                    String(l.action || '').includes('volunteer_hours') &&
                    (d.organizationId === g.organizationId ||
                      (Array.isArray(d.organizationIds) && d.organizationIds.includes(g.organizationId)))
                  );
                })
                .slice(0, 5)
                .map((l: any) => (
                  <div
                    key={l.id}
                    className="p-2 border-b text-xs text-muted-foreground flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{l.action.replace(/_/g, ' ')}</div>
                      <div className="text-xs">
                        {String(l.parsed?.hourId ?? '')} — {String(l.details).slice(0, 120)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.created_at || l.createdAt).toLocaleString()}
                    </div>
                    <div className="ml-4 pl-2">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAudit(l);
                          setShowAuditDetails(true);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}

              {/* Global audit details dialog (single instance per page) */}
              <Dialog open={showAuditDetails} onOpenChange={setShowAuditDetails}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Audit Log Details</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    {selectedAudit ? (
                      <div className="space-y-2 text-sm">
                        <div className="font-semibold">{selectedAudit.action}</div>
                        <div className="text-xs text-muted-foreground">User: {selectedAudit.user?.firstName} {selectedAudit.user?.lastName}</div>
                        <pre className="bg-slate-50 p-3 rounded max-h-64 overflow-auto text-xs">{selectedAudit.details}</pre>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No audit selected</div>
                    )}
                  </div>
                  <DialogFooter>
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => setShowAuditDetails(false)}>Close</Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              )}

              {/* pagination */}
              {auditMeta && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <div>Page {auditMeta.page ?? auditMeta.current_page ?? 1}</div>
                  <div className="flex items-center gap-2">
                    <Button size="xs" disabled={auditPage <= 1} onClick={() => setAuditPage((p) => Math.max(1, p - 1))}>
                      Prev
                    </Button>
                    <Button
                      size="xs"
                      disabled={auditMeta.page >= (auditMeta.lastPage ?? auditMeta.last_page ?? auditMeta.total_pages ?? 1)}
                      onClick={() => setAuditPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            {Array.isArray(g.items) && g.items.length > 0 && (
              <div className="p-4 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => bulkMutation.mutate(g.items.map((i: any) => i.id))}
                  disabled={bulkMutation.isLoading}
                >
                  Approve All in Org
                </Button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
