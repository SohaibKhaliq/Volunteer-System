import { useState } from 'react';
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
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Mail,
  Clock,
  Shield,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ComplianceDocument {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  docType: 'background_check' | 'wwcc' | 'police_check' | 'certification' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  uploadedAt: string;
  expiresAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  source?: 'compliance' | 'background_check';
}

export default function AdminCompliance() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');

  const { data: docsRaw, isLoading: isLoadingDocs } = useQuery(['compliance'], () => api.listCompliance());
  const { data: checksRaw, isLoading: isLoadingChecks } = useQuery(['background-checks'], () => api.listBackgroundChecks());
  const { data: usersRaw } = useQuery(['users', 'all'], () => api.listUsers());

  const isLoading = isLoadingDocs || isLoadingChecks;

  const users = Array.isArray(usersRaw) ? usersRaw : ((usersRaw as any)?.data ?? []);

  // normalize compliance documents
  const rawDocs = Array.isArray(docsRaw) ? docsRaw : ((docsRaw as any)?.data ?? []);
  const normalizedDocs = (rawDocs || []).map((d: any) => {
    const user = d.user || d.user_data || (d.user_id ? users.find((u: any) => u.id === d.user_id) : null) || {};
    // metadata may be json string
    let metadata: any = d.metadata || {};
    try {
      if (typeof metadata === 'string' && metadata.trim()) metadata = JSON.parse(metadata);
    } catch (e) {
      metadata = d.metadata;
    }

    // map backend doc types and statuses to UI-friendly values
    const docType = d.doc_type || d.docType || d.docTypeName || d.docType || 'other';
    // normalize status values
    let status = (d.status || '').toString().toLowerCase();
    if (status === 'valid') status = 'approved';
    if (status === 'invalid' || status === 'rejected') status = 'rejected';
    if (status === 'pending' || status === '') status = 'pending';

    return {
      id: d.id,
      userId: d.user_id || d.userId || (user && user.id),
      userName:
        (user && ((user.first_name || user.firstName) + ' ' + (user.last_name || user.lastName)).trim()) ||
        d.userName ||
        d.name ||
        '',
      userEmail: (user && (user.email || user.email_address)) || d.userEmail || d.email || '',
      docType: docType,
      status: status,
      uploadedAt: d.issued_at || d.created_at || d.uploaded_at || d.createdAt || null,
      expiresAt: d.expires_at || d.expiresAt || d.expires || null,
      verifiedAt: d.verified_at || d.verifiedAt || null,
      verifiedBy: metadata?.verifiedBy || metadata?.verified_by || d.verified_by || d.verifiedBy || null,
      notes: d.notes || metadata?.notes || null,
      riskLevel: d.risk_level || d.riskLevel || metadata?.riskLevel || null,
      file: metadata?.file || null,
      source: 'compliance'
    };
  });

  // normalize background checks
  const rawChecks = Array.isArray(checksRaw) ? checksRaw : ((checksRaw as any)?.data ?? []);
  const normalizedChecks = (rawChecks || []).map((c: any) => {
    const user = c.user || (c.user_id ? users.find((u: any) => u.id === c.user_id) : null) || {};

    let status = (c.status || '').toString().toLowerCase();
    if (status === 'clear') status = 'approved';

    return {
      id: c.id,
      userId: c.user_id || c.userId || user?.id,
      userName: user?.name || (user?.first_name ? `${user.first_name} ${user.last_name}` : '') || c.user?.email || 'Unknown',
      userEmail: user?.email || c.user?.email || '',
      docType: 'background_check',
      status: status,
      uploadedAt: c.created_at || c.createdAt || null,
      expiresAt: null, // Background checks might not have explicit expiry in this model yet
      verifiedAt: status === 'approved' ? (c.updated_at || c.updatedAt) : null,
      verifiedBy: null,
      notes: c.notes || null,
      riskLevel: c.status === 'rejected' ? 'high' : 'low',
      file: null,
      source: 'background_check'
    };
  });

  const docs = [...normalizedDocs, ...normalizedChecks].sort((a, b) =>
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (docId: number) =>
      api.updateComplianceDoc(docId, { status: 'approved', verifiedAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries(['compliance']);
      toast({ title: 'Document approved', variant: 'success' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ docId, notes }: { docId: number; notes: string }) =>
      api.updateComplianceDoc(docId, { status: 'rejected', notes }),
    onSuccess: () => {
      queryClient.invalidateQueries(['compliance']);
      toast({ title: 'Document rejected', variant: 'success' });
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: (userId: number) => api.sendComplianceReminder(userId),
    onSuccess: () => {
      toast({ title: 'Reminder sent', variant: 'success' });
    }
  });

  // removed unused background-checks query and createCheck mutation — not referenced by current UI

  // details modal state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const openDocument = async (doc: any) => {
    try {
      const res: any = await api.getComplianceFile(doc.id);
      // res may contain a blob
      const data = res?.data ?? res;
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Try to preserve filename when available in metadata
      const filename = (doc.file && (doc.file.storedName || doc.file.path?.split('/').pop())) || `document-${doc.id}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error('Unable to open document');
    }
  };

  const openDetails = (doc: any) => {
    setSelectedDoc(doc);
    setDetailsOpen(true);
  };

  const riskMutation = useMutation({
    mutationFn: ({ id, risk }: { id: number; risk: string }) => api.updateComplianceDoc(id, { risk_level: risk }),
    onSuccess: () => {
      queryClient.invalidateQueries(['compliance']);
      toast({ title: 'Risk level updated', variant: 'success' });
    },
    onError: () => toast.error('Failed to update risk level')
  });

  // Filter documents
  const filteredDocs = docs?.filter((doc: any) => {
    const matchesSearch =
      (doc.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesDocType = docTypeFilter === 'all' || doc.docType === docTypeFilter;

    return matchesSearch && matchesStatus && matchesDocType;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string; icon: any }> = {
      pending: { color: 'bg-yellow-500', label: 'Pending', icon: Clock },
      approved: { color: 'bg-green-500', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-500', label: 'Rejected', icon: XCircle },
      expired: { color: 'bg-orange-500', label: 'Expired', icon: AlertTriangle }
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {variant.label}
      </Badge>
    );
  };

  const getRiskBadge = (risk?: string) => {
    if (!risk) return null;
    const colors: Record<string, string> = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-red-500' };
    return <Badge className={colors[risk]}>{risk?.toUpperCase()} RISK</Badge>;
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      background_check: 'Background Check',
      wwcc: 'WWCC',
      police_check: 'Police Check',
      certification: 'Certification',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading compliance documents...</div>
      </div>
    );
  }

  const pendingCount = docs?.filter((d: any) => d.status === 'pending').length || 0;
  const expiredCount = docs?.filter((d: any) => isExpired(d.expiresAt)).length || 0;
  const expiringSoonCount = docs?.filter((d: any) => isExpiringSoon(d.expiresAt)).length || 0;
  const highRiskCount = docs?.filter((d: any) => d.riskLevel === 'high').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance & Verification</h2>
          <p className="text-muted-foreground">Manage volunteer compliance documents and background checks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Bulk Reminders
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by volunteer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Status: {statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('approved')}>Approved</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>Rejected</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('expired')}>Expired</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Type: {docTypeFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDocTypeFilter('all')}>All Types</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDocTypeFilter('background_check')}>Background Check</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDocTypeFilter('wwcc')}>WWCC</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDocTypeFilter('police_check')}>Police Check</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDocTypeFilter('certification')}>Certification</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 text-yellow-700">
            <Clock className="h-5 w-5" />
            <div className="text-sm font-medium">Pending Review</div>
          </div>
          <div className="text-2xl font-bold mt-2">{pendingCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <div className="text-sm font-medium">Expired</div>
          </div>
          <div className="text-2xl font-bold mt-2">{expiredCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-5 w-5" />
            <div className="text-sm font-medium">Expiring Soon</div>
          </div>
          <div className="text-2xl font-bold mt-2">{expiringSoonCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center gap-2 text-purple-700">
            <Shield className="h-5 w-5" />
            <div className="text-sm font-medium">High Risk</div>
          </div>
          <div className="text-2xl font-bold mt-2">{highRiskCount}</div>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Volunteer</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Verified By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs && filteredDocs.length > 0 ? (
              filteredDocs.map((doc: any) => (
                <TableRow
                  key={doc.id}
                  className={
                    isExpired(doc.expiresAt) ? 'bg-red-50' : isExpiringSoon(doc.expiresAt) ? 'bg-yellow-50' : ''
                  }
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.userName}</div>
                      <div className="text-sm text-muted-foreground">{doc.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getDocTypeLabel(doc.docType)}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-sm">{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {doc.expiresAt ? (
                      <div className="text-sm">
                        <div>{new Date(doc.expiresAt).toLocaleDateString()}</div>
                        {isExpired(doc.expiresAt) && <Badge className="bg-red-500 mt-1">Expired</Badge>}
                        {isExpiringSoon(doc.expiresAt) && !isExpired(doc.expiresAt) && (
                          <Badge className="bg-orange-500 mt-1">Expiring Soon</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getRiskBadge(doc.riskLevel)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.verifiedBy || 'Not verified'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {doc.source === 'background_check' ? (
                          <>
                            <DropdownMenuItem onClick={() => window.location.href = '/admin/background-checks'}>
                              <Eye className="h-4 w-4 mr-2" />
                              Manage in Background Checks
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => openDocument(doc)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDetails(doc)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* show approve/reject for pending, and always allow verify via details modal */}
                            {doc.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => approveMutation.mutate(doc.id)} className="text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const notes = prompt('Rejection reason:');
                                    if (notes) rejectMutation.mutate({ docId: doc.id, notes });
                                  }}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDetails(doc)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Verify / Edit Risk
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => sendReminderMutation.mutate(doc.userId)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No compliance documents found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            {!selectedDoc ? (
              <div>No document selected</div>
            ) : (
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium">Volunteer</div>
                  <div>{selectedDoc.userName}</div>
                  <div className="text-sm text-muted-foreground">{selectedDoc.userEmail}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Document Type</div>
                  <div>{getDocTypeLabel(selectedDoc.docType)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Uploaded</div>
                  <div>{selectedDoc.uploadedAt ? new Date(selectedDoc.uploadedAt).toLocaleString() : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Expires</div>
                  <div>{selectedDoc.expiresAt ? new Date(selectedDoc.expiresAt).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div>{selectedDoc.status}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Verified By</div>
                  <div>{selectedDoc.verifiedBy || 'Not verified'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Risk Level</div>
                  <div className="mt-1">
                    <select
                      value={selectedDoc.riskLevel || ''}
                      onChange={(e) => setSelectedDoc({ ...selectedDoc, riskLevel: e.target.value })}
                      className="border rounded p-1"
                    >
                      <option value="">(none)</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <Button
                      size="sm"
                      className="ml-2"
                      onClick={() => {
                        if (!selectedDoc) return;
                        riskMutation.mutate({ id: selectedDoc.id, risk: selectedDoc.riskLevel });
                      }}
                    >
                      Save Risk
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Notes</div>
                  <div className="text-sm">{selectedDoc.notes || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">File</div>
                  <div>
                    {selectedDoc.file ? (
                      <a
                        href={`/compliance/${selectedDoc.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600"
                      >
                        {selectedDoc.file.originalName || 'Download file'}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">No file attached</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              {selectedDoc && selectedDoc.status === 'pending' && (
                <>
                  <Button onClick={() => selectedDoc && approveMutation.mutate(selectedDoc.id)}>Approve</Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const notes = prompt('Rejection reason:');
                      if (notes && selectedDoc) rejectMutation.mutate({ docId: selectedDoc.id, notes });
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
