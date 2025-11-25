import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  MoreHorizontal,
  Loader2
} from 'lucide-react';

export default function OrganizationCompliance() {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  // Fetch Documents
  const { data: documents, isLoading: isDocsLoading } = useQuery({
    queryKey: ['organizationDocuments'],
    queryFn: api.listOrganizationDocuments
  });

  // Fetch Stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['organizationComplianceStats'],
    queryFn: api.getOrganizationComplianceStats
  });

  // Upload/Update Document Mutation
  const saveDocMutation = useMutation({
    mutationFn: (data: any) => {
      // Note: In a real app, this would likely involve FormData for file uploads
      // For now, we're simulating it with JSON data as per the previous implementation
      if (editingDoc) {
        // Assuming we have an update endpoint or logic
        return api.uploadOrganizationDocument({ ...data, id: editingDoc.id });
      }
      return api.uploadOrganizationDocument(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationDocuments'] });
      setIsUploadOpen(false);
      toast.success(editingDoc ? 'Document updated successfully' : 'Document uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to save document');
    }
  });

  // Delete Document Mutation
  const deleteDocMutation = useMutation({
    mutationFn: api.deleteOrganizationDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationDocuments'] });
      toast.success('Document deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete document');
    }
  });

  const [docFormData, setDocFormData] = useState({
    name: '',
    type: 'License',
    expiry: ''
  });

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
    saveDocMutation.mutate({
      ...docFormData,
      status: 'Pending', // Default status for new uploads
      uploadedAt: new Date().toISOString().split('T')[0]
    });
  };

  const volunteerCompliance = [
    { id: 1, requirement: 'Background Check', total: 124, compliant: 118, pending: 6 },
    { id: 2, requirement: 'Code of Conduct', total: 124, compliant: 124, pending: 0 },
    { id: 3, requirement: 'Safety Training', total: 124, compliant: 98, pending: 26 }
  ];

  if (isDocsLoading || isStatsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayDocs = Array.isArray(documents) ? documents : [];
  const displayStats = stats || {
    compliantVolunteers: 0,
    pendingDocuments: 0,
    expiringSoon: 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance</h2>
          <p className="text-muted-foreground">Manage legal documents and volunteer certifications.</p>
        </div>
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
                  <Input
                    id="doc-type"
                    placeholder="e.g. Insurance"
                    value={docFormData.type}
                    onChange={(e) => setDocFormData({ ...docFormData, type: e.target.value })}
                  />
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
                <Input id="file" type="file" />
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
                displayDocs.map((doc: any) => (
                  <TableRow key={doc.id}>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volunteer Compliance</CardTitle>
          <CardDescription>Tracking volunteer requirements.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {volunteerCompliance.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.requirement}</span>
                  <span className="text-muted-foreground">
                    {item.compliant}/{item.total} Compliant
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${item.pending > 0 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${(item.compliant / item.total) * 100}%` }}
                  ></div>
                </div>
                {item.pending > 0 && (
                  <p className="text-xs text-orange-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {item.pending} volunteers pending verification
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
