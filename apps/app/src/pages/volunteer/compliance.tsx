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
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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

    const { t } = useTranslation();

    return (
        <div className={cn("space-y-8", embed ? "" : "container mx-auto p-6 max-w-5xl")}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/30 p-8 rounded-[2.5rem] border border-border/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
                {!embed && (
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">{t('My Compliance')}</h1>
                        <p className="text-lg text-muted-foreground font-medium">{t('Manage your certifications and legal documents required for volunteering.')}</p>
                    </div>
                )}
                {embed && <div className="hidden" />}
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 bg-primary group transition-all">
                            <Upload className="mr-3 h-5 w-5 transition-transform group-hover:-translate-y-1" />
                            {t('Upload Document')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-none rounded-[2.5rem] p-0 overflow-hidden shadow-2xl shadow-black/20">
                        <DialogHeader className="p-8 pb-0">
                            <DialogTitle className="text-3xl font-black tracking-tight">{t('Upload Document')}</DialogTitle>
                            <DialogDescription className="text-lg font-medium text-muted-foreground">
                                {t('Add a new compliance document for verification.')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 p-8">
                            <div className="space-y-2">
                                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">{t('Document Type')}</Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, docType: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-background/50 font-medium">
                                        <SelectValue placeholder={t('Select type')} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/50 shadow-xl overflow-hidden">
                                        <SelectItem value="" disabled>{t('Select a Document Type')}</SelectItem>
                                        {/* System Types Group */}
                                        <div className="px-4 py-3 text-xs font-black uppercase tracking-widest text-primary/60 bg-primary/5">{t('Standard Documents')}</div>
                                        {systemTypes.map((t: any) => (
                                            <SelectItem key={t.value} value={t.value} className="py-3 px-4 font-medium transition-colors cursor-pointer">{t.label}</SelectItem>
                                        ))}

                                        {/* Organization Types Group */}
                                        {orgTypes.length > 0 && (
                                            <>
                                                <div className="px-4 py-3 text-xs font-black uppercase tracking-widest text-primary/60 bg-primary/5 mt-2">{t('Organization Requirements')}</div>
                                                {orgTypes.map((t: any) => (
                                                    <SelectItem key={t.value} value={t.value} className="py-3 px-4 font-medium transition-colors cursor-pointer">{t.label}</SelectItem>
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

                            <DialogFooter className="p-8 pt-0 mt-4">
                                <Button type="submit" disabled={uploadMutation.isLoading} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                    {uploadMutation.isLoading ? t('Uploading...') : t('Submit for Verification')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: t('Documents Submitted'), value: documents.length, color: 'text-primary', bg: 'bg-primary/10', icon: FileText },
                    { label: t('Pending Approval'), value: documents.filter((d: any) => d.status === 'pending').length, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
                    { label: t('Action Required'), value: documents.filter((d: any) => d.status === 'rejected' || d.status === 'expired').length, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertCircle }
                ].map((stat, i) => (
                    <Card key={i} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-border/50 rounded-[2.5rem] bg-card overflow-hidden">
                        <CardContent className="p-8 space-y-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <div className={cn("text-3xl font-black tracking-tight", stat.color)}>{stat.value}</div>
                                <div className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-border/50 shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-card overflow-hidden">
                {!embed && (
                    <CardHeader className="p-8 md:p-12 pb-0">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-3xl font-black tracking-tight">{t('Your Documents')}</CardTitle>
                        </div>
                        <CardDescription className="text-lg font-medium pl-14">
                            {t('Certifications and identity documents')}
                        </CardDescription>
                    </CardHeader>
                )}
                <CardContent className={cn("p-0", embed ? "pt-0" : "p-8 md:p-12")}>
                    {documents.length === 0 ? (
                        <div className="text-center py-24 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/50 m-8">
                            <FileText className="mx-auto h-16 w-16 text-muted-foreground/30 mb-6" />
                            <h3 className="text-2xl font-black text-foreground mb-2">{t('No documents yet')}</h3>
                            <p className="text-muted-foreground font-medium text-lg mb-8">{t('Upload your certifications to start volunteering.')}</p>
                            <Button size="lg" className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20" onClick={() => setIsUploadOpen(true)}>
                                {t('Upload First Document')}
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-[2rem] border border-border/50 overflow-hidden bg-background/50 backdrop-blur-sm">
                            <Table>
                                <TableHeader className="bg-primary/5 text-primary">
                                    <TableRow className="border-border/50 hover:bg-transparent">
                                        <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs">{t('Document Type')}</TableHead>
                                        <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs">{t('Uploaded On')}</TableHead>
                                        <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs">{t('Expiry')}</TableHead>
                                        <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs">{t('Status')}</TableHead>
                                        <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-xs text-right">{t('Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc: any) => (
                                        <TableRow key={doc.id} className="border-border/50 hover:bg-muted/20 transition-colors group">
                                            <TableCell className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-muted text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                        <File className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-black text-lg tracking-tight truncate max-w-[200px]">
                                                        {getTypeLabel(doc.docType) || doc.docType || doc.doc_type}
                                                    </span>
                                                </div>
                                                {doc.notes && doc.status === 'rejected' && (
                                                    <div className="text-xs font-black text-destructive uppercase tracking-widest mt-2 ml-10">Reason: {doc.notes}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-8 py-6 font-bold text-muted-foreground">
                                                {doc.uploadedAt || doc.created_at ? format(new Date(doc.uploadedAt || doc.created_at), 'MMM d, yyyy') : '-'}
                                            </TableCell>
                                            <TableCell className="px-8 py-6 font-bold text-muted-foreground">
                                                {doc.expiresAt || doc.expires_at ? format(new Date(doc.expiresAt || doc.expires_at), 'MMM d, yyyy') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                {getStatusBadge(doc.status)}
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-right">
                                                <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold bg-muted hover:bg-primary hover:text-white group/btn" asChild>
                                                    <a href={`/api/compliance/${doc.id}/file`} target="_blank" rel="noopener noreferrer">
                                                        <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
