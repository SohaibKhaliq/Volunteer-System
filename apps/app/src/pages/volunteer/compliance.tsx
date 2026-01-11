import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/atoms/use-toast';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, XCircle, Download, File, Wallet, ChevronRight, MoreHorizontal, Share2, Award, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Mock Training Data (until backend endpoint is ready)
const MOCK_TRAINING_MODULES = [
    { id: 1, title: 'Volunteer Basics', progress: 100, status: 'completed' },
    { id: 2, title: 'Child Safety Level 1', progress: 65, status: 'in_progress' },
    { id: 3, title: 'Emergency Response', progress: 0, status: 'not_started' },
];

export default function VolunteerCompliance({ embed = false }: { embed?: boolean }) {
    const queryClient = useQueryClient();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [qrOpen, setQrOpen] = useState<number | null>(null);

    const { t } = useTranslation();

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
            setFormData({ docType: '', wwccNumber: '', wwccState: '', expiryDate: '', file: null });
            toast({ title: 'Added to Wallet', description: 'Document uploaded successfully', variant: 'success' });
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

    return (
        <div className={cn("space-y-6", embed ? "" : "container mx-auto p-4 md:p-8 max-w-5xl")}>

            {/* Header Section */}
            {!embed && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                            <Wallet className="h-8 w-8 text-primary" />
                            {t('My Wallet')}
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            {t('Access your digital certifications and training records.')}
                        </p>
                    </div>
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 font-bold">
                                <Upload className="mr-2 h-4 w-4" />
                                {t('Add Document')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{t('Add to Wallet')}</DialogTitle>
                                <DialogDescription>{t('Upload a new certification or legal document.')}</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Document Type</Label>
                                    <Select onValueChange={(v) => setFormData({ ...formData, docType: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="" disabled>{t('Select a Document Type')}</SelectItem>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">Standard Documents</div>
                                            {systemTypes.map((t: any) => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                            {orgTypes.length > 0 && (
                                                <>
                                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">Organization Requirements</div>
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
                                            <Input placeholder="e.g. WWC1234567" value={formData.wwccNumber} onChange={e => setFormData({ ...formData, wwccNumber: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>State</Label>
                                            <Select onValueChange={(v) => setFormData({ ...formData, wwccState: v })}>
                                                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                                                <SelectContent>
                                                    {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Expiry Date</Label>
                                    <Input type="date" onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Document File</Label>
                                    <Input type="file" onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })} />
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={uploadMutation.isLoading}>
                                        {uploadMutation.isLoading ? t('Uploading...') : t('Add to Wallet')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* Wallet "Cards" Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Training Progress Card (Static for now) */}
                <div className="col-span-full mb-4">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-indigo-600" />
                        Ongoing Training
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {MOCK_TRAINING_MODULES.map(module => (
                            <Card key={module.id} className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-sm">{module.title}</div>
                                        <Badge variant={module.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                            {module.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{module.progress}%</span>
                                        </div>
                                        <Progress value={module.progress} className="h-2" indicatorClassName={module.status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'} />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                                            {module.status === 'completed' ? 'Review' : 'Continue'} <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="col-span-full">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Certifications & Documents
                    </h3>
                </div>

                {documents.map((doc: any) => {
                    const isValid = doc.status?.toLowerCase() === 'valid' || doc.status?.toLowerCase() === 'approved';
                    const isExpired = doc.status?.toLowerCase() === 'expired';

                    return (
                        <div key={doc.id} className="relative group perspective-1000">
                            {/* Card UI */}
                            <div className={cn(
                                "relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                                isValid ? "border-l-4 border-l-green-500" :
                                    isExpired ? "border-l-4 border-l-red-500" :
                                        "border-l-4 border-l-amber-500"
                            )}>
                                {/* Background Pattern */}
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Award className="h-24 w-24" />
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 rounded-lg bg-muted text-primary">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => window.open(doc.metadata?.file || `/api/compliance/${doc.id}/file`, '_blank')}>
                                                    <Download className="mr-2 h-4 w-4" /> Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setQrOpen(doc.id)}>
                                                    <QrCode className="mr-2 h-4 w-4" /> View QR Code
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/verify/${doc.id}`, '_blank')}>
                                                    <Share2 className="mr-2 h-4 w-4" /> Public Link
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="font-bold text-lg leading-tight mb-1">{getTypeLabel(doc.docType) || doc.docType || doc.doc_type}</h3>
                                        <p className="text-xs text-muted-foreground">ID: {doc.id} • Uploaded {format(new Date(doc.uploadedAt || doc.created_at), 'MMM d, yyyy')}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed">
                                        <div className="text-sm">
                                            <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Status</div>
                                            <div className={cn(
                                                "font-bold flex items-center gap-1.5",
                                                isValid ? "text-green-600" : isExpired ? "text-red-600" : "text-amber-600"
                                            )}>
                                                {isValid ? <CheckCircle className="h-3.5 w-3.5" /> :
                                                    isExpired ? <AlertCircle className="h-3.5 w-3.5" /> :
                                                        <Clock className="h-3.5 w-3.5" />}
                                                {doc.status}
                                            </div>
                                        </div>

                                        {doc.expiresAt && (
                                            <div className="text-sm text-right">
                                                <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Expires</div>
                                                <div className="font-mono">{format(new Date(doc.expiresAt), 'MM/yy')}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* QR Dialog for this card */}
                            <Dialog open={qrOpen === doc.id} onOpenChange={(open) => !open && setQrOpen(null)}>
                                <DialogContent className="sm:max-w-xs flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-48 h-48 bg-white p-2 rounded-lg shadow-inner border mb-4 flex items-center justify-center">
                                        {/* Placeholder for QR Code - in real app use a QR library */}
                                        <div className="space-y-2">
                                            <QrCode className="h-24 w-24 text-primary mx-auto opacity-20" />
                                            <p className="text-[10px] text-muted-foreground font-mono">SCAN TO VERIFY</p>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{getTypeLabel(doc.docType)}</h3>
                                    <p className="text-xs text-muted-foreground break-all">
                                        {window.location.origin}/verify/{doc.id}
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => window.open(`/verify/${doc.id}`, '_blank')}>
                                        Open Verification Page
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        </div>
                    );
                })}

                {/* Empty State */}
                {documents.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold">Your Wallet is Empty</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Upload your certifications and documents to keep them organized and accessible.</p>
                        <Button onClick={() => setIsUploadOpen(true)}>Add First Document</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
