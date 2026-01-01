import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/atoms/use-toast';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, XCircle, Download, File } from 'lucide-react';
import { format } from 'date-fns';

export default function VolunteerCompliance({ embed = false }: { embed?: boolean }) {
    const queryClient = useQueryClient();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Fetch my documents
    const { data: documentsRaw } = useQuery({
        queryKey: ['my-compliance'],
        queryFn: () => api.listCompliance()
    });

    // Fetch available types
    const { data: typesData } = useQuery({
        queryKey: ['compliance-types'],
        queryFn: () => api.getComplianceTypes()
    });

    const documents = Array.isArray(documentsRaw) ? documentsRaw : ((documentsRaw as any)?.data ?? []);

    // Flatten types for easy lookup
    const systemTypes = typesData?.system || [];
    const orgTypes = typesData?.organization || [];
    const allTypes = [...systemTypes, ...orgTypes];

    const getTypeLabel = (val: string) => {
        const found = allTypes.find((t: any) => t.value === val);
        return found ? found.label : val;
    };

    // Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: (formData: FormData) => api.uploadCompliance(formData),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-compliance']);
            setIsUploadOpen(false);
            toast({ title: 'Document uploaded successfully', variant: 'success' });
        },
        onError: (err: any) => {
            toast({ title: 'Upload failed', description: err.response?.data?.error || 'Something went wrong', variant: 'destructive' });
        }
    });

    const [formData, setFormData] = useState({
        docType: '',
        wwccNumber: '',
        wwccState: '',
        expiryDate: '',
        file: null as File | null
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.docType) {
            toast({ title: 'Please select a document type', variant: 'destructive' });
            return;
        }

        const payload = new FormData();
        payload.append('doc_type', formData.docType);
        if (formData.expiryDate) {
            payload.append('expires_at', new Date(formData.expiryDate).toISOString());
        }

        if (formData.docType === 'wwcc') {
            if (!formData.wwccNumber || !formData.wwccState) {
                toast({ title: 'WWCC Number and State are required', variant: 'destructive' });
                return;
            }
            payload.append('wwcc_number', formData.wwccNumber);
            payload.append('wwcc_state', formData.wwccState);
        } else {
            if (!formData.file) {
                toast({ title: 'Please select a file', variant: 'destructive' });
                return;
            }
        }

        if (formData.file) {
            payload.append('file', formData.file);
        }

        uploadMutation.mutate(payload);
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'approved' || s === 'valid') return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
        if (s === 'rejected' || s === 'invalid') return <Badge className="bg-red-500 hover:bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
        if (s === 'expired') return <Badge className="bg-orange-500 hover:bg-orange-600"><AlertCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    };

    return (
        <div className={`space-y-8 ${embed ? '' : 'container mx-auto p-6 max-w-5xl'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {!embed && (
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Compliance</h1>
                        <p className="text-muted-foreground mt-1">Manage your certifications and legal documents required for volunteering.</p>
                    </div>
                )}
                {embed && <div className="hidden" />} {/* Spacer if needed */}
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                            <DialogDescription>Add a new compliance document for verification.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Document Type</Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, docType: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="" disabled>Select a Document Type</SelectItem>
                                        {/* System Types Group */}
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Standard Documents</div>
                                        {systemTypes.map((t: any) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}

                                        {/* Organization Types Group */}
                                        {orgTypes.length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2 border-t pt-2">Organization Requirements</div>
                                                {orgTypes.map((t: any) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.docType === 'wwcc' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>WWCC Number</Label>
                                        <Input
                                            placeholder="e.g. WWC1234567"
                                            value={formData.wwccNumber}
                                            onChange={e => setFormData({ ...formData, wwccNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, wwccState: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NSW">NSW</SelectItem>
                                                <SelectItem value="VIC">VIC</SelectItem>
                                                <SelectItem value="QLD">QLD</SelectItem>
                                                <SelectItem value="WA">WA</SelectItem>
                                                <SelectItem value="SA">SA</SelectItem>
                                                <SelectItem value="TAS">TAS</SelectItem>
                                                <SelectItem value="ACT">ACT</SelectItem>
                                                <SelectItem value="NT">NT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Expiry Date (if applicable)</Label>
                                <Input
                                    type="date"
                                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Document File</Label>
                                <Input
                                    type="file"
                                    onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={uploadMutation.isLoading}>
                                    {uploadMutation.isLoading ? 'Uploading...' : 'Submit for Verification'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Documents Submitted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{documents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {documents.filter((d: any) => d.status === 'pending').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Action Required</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {documents.filter((d: any) => d.status === 'rejected' || d.status === 'expired').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                {!embed && (
                    <CardHeader>
                        <CardTitle>Your Documents</CardTitle>
                    </CardHeader>
                )}
                <CardContent className={embed ? "pt-6" : ""}>
                    {documents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-medium text-slate-900">No documents yet</h3>
                            <p>Upload your certifications to start volunteering.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Document Type</TableHead>
                                    <TableHead>Uploaded On</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc: any) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <File className="w-4 h-4 text-slate-400" />
                                                {getTypeLabel(doc.docType) || doc.docType || doc.doc_type}
                                            </div>
                                            {doc.notes && doc.status === 'rejected' && (
                                                <div className="text-xs text-red-500 mt-1">Reason: {doc.notes}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {doc.uploadedAt || doc.created_at ? format(new Date(doc.uploadedAt || doc.created_at), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {doc.expiresAt || doc.expires_at ? format(new Date(doc.expiresAt || doc.expires_at), 'MMM d, yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(doc.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={`/api/compliance/${doc.id}/file`} target="_blank" rel="noopener noreferrer">
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
