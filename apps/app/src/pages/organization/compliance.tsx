import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  MoreHorizontal,
  Loader2,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrganizationCompliance() {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastUploadedId, setLastUploadedId] = useState<string | number | null>(null);
  const lastUploadedTimeoutRef = useRef<number | null>(null);

  // Fetch Documents
  const { data: documents, isLoading: isDocsLoading } = useQuery({
    queryKey: ['organizationDocuments'],
    queryFn: () => api.listOrganizationDocuments()
  });

  // Fetch Stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['organizationComplianceStats'],
    queryFn: () => api.getOrganizationComplianceStats()
  });

  // Upload/Update Document Mutation
  const saveDocMutation = useMutation({
    mutationFn: (data: any) => {
      // Expecting FormData for file uploads — pass through to API helper
      if (editingDoc) {
        // ensure id present when editing
        if (data instanceof FormData) {
          data.append('id', String(editingDoc.id));
          return api.uploadOrganizationDocument(data);
        }
        return api.uploadOrganizationDocument({ ...data, id: editingDoc.id });
      }
      return api.uploadOrganizationDocument(data);
    },
    onSuccess: (res: any) => {
      // API wrapper returns response.data in many places — normalize
      const created = (res && (res.data ?? res)) || res;
      const mapped = mapDoc(created ?? {});
      // set last uploaded id for temporary highlight
      try {
        if (mapped?.id) {
          setLastUploadedId(mapped.id);
          if (lastUploadedTimeoutRef.current) window.clearTimeout(lastUploadedTimeoutRef.current);
          lastUploadedTimeoutRef.current = window.setTimeout(() => setLastUploadedId(null), 6000);
        }
      } catch (e) {}
      try {
        queryClient.invalidateQueries({ queryKey: ['organizationDocuments'] });
      } catch (e) {}
      setIsUploadOpen(false);
      setSelectedFile(null);
      setEditingDoc(null);
      setDocFormData({ name: '', type: 'License', expiry: '' });
      toast({
        title: editingDoc ? 'Document updated successfully' : 'Document uploaded successfully',
        description: `${mapped.name} • ${mapped.type}`,
        variant: 'success'
      });
    },
    onError: () => {
      toast({ title: 'Failed to save document', variant: 'destructive' });
    }
  });

  // Delete Document Mutation
  const deleteDocMutation = useMutation({
    mutationFn: api.deleteOrganizationDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationDocuments'] });
      toast({ title: 'Document deleted successfully', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to delete document', variant: 'destructive' });
    }
  });

  const [docFormData, setDocFormData] = useState({
    name: '',
    type: '',
    expiry: ''
  });

  // Fetch available compliance types (system + org requirements)
  const { data: typesData } = useQuery({
    queryKey: ['compliance-types'],
    queryFn: () => api.getComplianceTypes()
  });

  // Normalize compliance types response and support org requirement tokens like `req_<id>`
  const rawTypes = (typesData && (typesData.data ?? typesData)) || typesData || {};
  const systemTypes = (rawTypes.system || rawTypes.systemTypes || []).map((t: any) => ({
    value: t.value ?? t.slug ?? t.name ?? t.label ?? String(t.id),
    label: t.label ?? t.name ?? t.title ?? String(t.value ?? t.slug ?? t.id)
  }));
  const orgTypes = (rawTypes.organization || rawTypes.organization_requirements || rawTypes.organizationRequirements || []).map(
    (t: any) => ({ value: t.value ?? `req_${t.id}`, label: t.label ?? t.name ?? t.title ?? `Requirement ${t.id}` })
  );

  const handleOpenUpload = () => {
    setEditingDoc(null);
    setDocFormData({ name: '', type: 'License', expiry: '' });
    setIsUploadOpen(true);
  };

  const handleOpenEdit = (doc: any) => {
    setEditingDoc(doc);
    setDocFormData({
      name: doc.name,
      type: doc.type,
      expiry: doc.expiry
    });
    setIsUploadOpen(true);
  };

  const handleDocSubmit = () => {
    try {
      const form = new FormData();
      form.append('name', docFormData.name || '');
      form.append('type', docFormData.type || '');
      if (docFormData.expiry) form.append('expiry', docFormData.expiry);
      form.append('status', 'Pending');
      form.append('uploadedAt', new Date().toISOString().split('T')[0]);
      if (selectedFile) form.append('file', selectedFile);
      // append selected organization id if available
      try {
        const raw = localStorage.getItem('selectedOrganization') || localStorage.getItem('selectedOrganizationName');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.id) form.append('organization_id', String(parsed.id));
          } catch (e) {
            // legacy string - no id available
          }
        }
      } catch (e) {}
      saveDocMutation.mutate(form);
    } catch (e) {
      saveDocMutation.mutate({
        ...docFormData,
        status: 'Pending',
        uploadedAt: new Date().toISOString().split('T')[0]
      });
    }
  };

  if (isDocsLoading || isStatsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Normalize documents responses which may be either an array or an object wrapper { data: [...] }
  const displayDocs = Array.isArray(documents)
    ? documents
    : Array.isArray((documents as any)?.data)
      ? (documents as any).data
      : [];

  // Normalize stats which may be returned as { data: {...} } or directly as object
  const displayStats = (stats as any)?.data ??
    stats ?? {
      compliantVolunteers: 0,
      pendingDocuments: 0,
      expiringSoon: 0
    };

  // Map common backend field names to the UI-friendly shape
  const mapDoc = (doc: any) => ({
    id: doc.id ?? doc.document_id ?? doc.file_id,
    name: doc.name ?? doc.title ?? doc.file_name ?? 'Untitled document',
    type: doc.type ?? doc.category ?? doc.document_type ?? 'Document',
    status: doc.status ?? doc.state ?? doc.verification_status ?? 'Pending',
    expiry: doc.expiry ?? doc.expires_at ?? doc.expiry_date ?? ''
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance</h2>
          <p className="text-muted-foreground">Manage legal documents and organization requirements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/organization/compliance-requirements" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Manage Requirements
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['organizationDocuments'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDoc ? 'Edit Document' : 'Upload Compliance Document'}</DialogTitle>
                <DialogDescription>
                  {editingDoc ? 'Update document details.' : 'Upload a new license, certification, or policy document.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input
                    id="doc-name"
                    placeholder="e.g. Liability Insurance"
                    value={docFormData.name}
                    onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-type">Type</Label>
                    <Select onValueChange={(v) => setDocFormData({ ...docFormData, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" disabled>
                          Select a Document Type
                        </SelectItem>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Standard Documents
                        </div>
                        {systemTypes.map((t: any) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}

                        {orgTypes.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2 border-t pt-2">
                              Organization Requirements
                            </div>
                            {orgTypes.map((t: any) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-expiry">Expiry Date</Label>
                    <Input
                      id="doc-expiry"
                      type="date"
                      value={docFormData.expiry}
                      onChange={(e) => setDocFormData({ ...docFormData, expiry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDocSubmit} disabled={saveDocMutation.isLoading}>
                  {saveDocMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingDoc ? 'Update' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant Volunteers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.compliantVolunteers}%</div>
            <p className="text-xs text-muted-foreground">+2.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.pendingDocuments}</div>
            <p className="text-xs text-muted-foreground">Documents awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Documents expiring in 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Documents</CardTitle>
          <CardDescription>Official documents, licenses, and insurance policies.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No documents found. Upload one to ensure compliance.
                  </TableCell>
                </TableRow>
              ) : (
                displayDocs.map((raw: any) => {
                  const doc = mapDoc(raw);
                  const isNew = lastUploadedId != null && String(doc.id) === String(lastUploadedId);
                  return (
                    <TableRow key={doc.id} className={isNew ? 'bg-yellow-50 animate-pulse' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.name}
                        </div>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            doc.status === 'Valid' ? 'default' : doc.status === 'Expiring' ? 'destructive' : 'secondary'
                          }
                          className={doc.status === 'Valid' ? 'bg-green-500' : ''}
                        >
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{doc.expiry}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(doc)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => deleteDocMutation.mutate(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
