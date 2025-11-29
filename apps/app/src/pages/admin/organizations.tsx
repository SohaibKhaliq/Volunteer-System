import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';
import OrganizationModal from '@/components/admin/OrganizationModal';
import OrganizationAnalytics from '@/components/admin/OrganizationAnalytics';

interface Organization {
  id: number;
  name: string;
  description: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  volunteerCount?: number;
  eventCount?: number;
  complianceScore?: number;
  performanceScore?: number;
  logo?: string;
  logoThumb?: string | null;
}

export default function AdminOrganizations() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [analyticsOrgId, setAnalyticsOrgId] = useState<number | null>(null);
  const [analyticsOrgName, setAnalyticsOrgName] = useState<string | null>(null);

  const { data: orgs, isLoading } = useQuery<Organization[]>(['organizations'], api.listOrganizations, {
    select: (data: any) => {
      // Normalize backend snake_case to camelCase for the UI
      if (!data) return [] as Organization[];
      const list: any[] = Array.isArray(data) ? data : data.data || [];
      return list.map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        logo: o.logo ?? null,
        logoThumb: o.logo_thumb ?? null,
        isApproved: o.is_approved ?? o.isApproved ?? false,
        isActive: o.is_active ?? o.isActive ?? true,
        createdAt: o.created_at ?? o.createdAt ?? new Date().toISOString(),
        volunteerCount: o.volunteer_count ?? o.volunteerCount ?? 0,
        eventCount: o.event_count ?? o.eventCount ?? 0,
        complianceScore: o.compliance_score ?? o.complianceScore ?? 100,
        performanceScore: o.performance_score ?? o.performanceScore ?? undefined
      })) as Organization[];
    }
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (orgId: number) => api.updateOrganization(orgId, { is_approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast({ title: 'Organization approved', variant: 'success' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (orgId: number) => api.updateOrganization(orgId, { is_approved: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast({ title: 'Organization rejected', variant: 'success' });
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (orgId: number) => api.updateOrganization(orgId, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast({ title: 'Organization deactivated', variant: 'success' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (orgId: number) => api.deleteOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast({ title: 'Organization deleted', variant: 'success' });
    }
  });

  // Filter organizations
  const filteredOrgs = orgs?.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'approved') matchesStatus = org.isApproved;
    if (statusFilter === 'pending') matchesStatus = !org.isApproved;
    if (statusFilter === 'active') matchesStatus = org.isActive;
    if (statusFilter === 'inactive') matchesStatus = !org.isActive;

    return matchesSearch && matchesStatus;
  });

  const getPerformanceBadge = (score?: number) => {
    // treat only null/undefined as missing; allow 0 to be a valid score
    if (score === undefined || score === null) return <Badge variant="outline">N/A</Badge>;
    if (score >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-blue-500">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organization Management</h2>
          <p className="text-muted-foreground"> Approve, monitor, and manage volunteer organizations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button size="sm" onClick={() => setShowOrgModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter: {statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('approved')}> Approved </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending Approval</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>Inactive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total Organizations</div>
          <div className="text-2xl font-bold">{orgs?.length || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Approved</div>
          <div className="text-2xl font-bold text-green-600">{orgs?.filter((o) => o.isApproved).length || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-600">{orgs?.filter((o) => !o.isApproved).length || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-blue-600">{orgs?.filter((o) => o.isActive).length || 0}</div>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Volunteers</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs && filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {org.logoThumb ? (
                        <img src={org.logoThumb} alt={`${org.name} logo`} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted-foreground/10 flex items-center justify-center text-sm text-muted-foreground">
                          {org.name?.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{org.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-col">
                      {org.isApproved ? (
                        <Badge className="bg-green-500 w-fit">Approved</Badge>
                      ) : (
                        <Badge className="bg-yellow-500 w-fit">Pending</Badge>
                      )}
                      {org.isActive ? (
                        <Badge variant="outline" className="w-fit">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="w-fit">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{org.volunteerCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{org.eventCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPerformanceBadge(org.performanceScore)}</TableCell>
                  <TableCell>
                    {org.complianceScore && org.complianceScore < 70 ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{org.complianceScore}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-green-600">{org.complianceScore || 100}%</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOrg(org);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditOrg(org);
                            setShowOrgModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Organization
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setAnalyticsOrgId(org.id);
                            setAnalyticsOrgName(org.name || null);
                            setShowAnalyticsDialog(true);
                          }}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!org.isApproved ? (
                          <DropdownMenuItem onClick={() => approveMutation.mutate(org.id)} className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => rejectMutation.mutate(org.id)} className="text-orange-600">
                            <XCircle className="h-4 w-4 mr-2" />
                            Revoke Approval
                          </DropdownMenuItem>
                        )}
                        {org.isActive && (
                          <DropdownMenuItem
                            onClick={() => deactivateMutation.mutate(org.id)}
                            className="text-orange-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete this organization? This action cannot be undone.'
                              )
                            ) {
                              deleteMutation.mutate(org.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOrg?.name}</DialogTitle>
            <DialogDescription>{selectedOrg?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="mt-1">
                  {selectedOrg?.isApproved ? (
                    <Badge className="bg-green-500">Approved</Badge>
                  ) : (
                    <Badge className="bg-yellow-500">Pending</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Active</div>
                <div className="mt-1">
                  {selectedOrg?.isActive ? (
                    <Badge className="bg-green-500">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Volunteers</div>
                <div className="mt-1 text-lg font-semibold"> {selectedOrg?.volunteerCount || 0} </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Events Created</div>
                <div className="mt-1 text-lg font-semibold"> {selectedOrg?.eventCount || 0} </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Performance Score</div>
                <div className="mt-1">{getPerformanceBadge(selectedOrg?.performanceScore)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Compliance Score</div>
                <div className="mt-1 text-lg font-semibold"> {selectedOrg?.complianceScore || 100}% </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <OrganizationModal
        open={showOrgModal}
        onClose={() => {
          setShowOrgModal(false);
          setEditOrg(null);
        }}
        organization={editOrg}
        onSuccess={() => {
          queryClient.invalidateQueries(['organizations']);
          setShowOrgModal(false);
          setEditOrg(null);
        }}
      />
      <OrganizationAnalytics
        orgId={analyticsOrgId}
        orgName={analyticsOrgName}
        open={showAnalyticsDialog}
        onClose={() => setShowAnalyticsDialog(false)}
      />
    </div>
  );
}
