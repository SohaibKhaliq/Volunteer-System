import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, Download, Search, FileText, User, ShieldAlert, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/atoms/command';
import { toast } from '@/components/atoms/use-toast';
import api from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';

export default function OrganizationCertificates() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [selectedCert, setSelectedCert] = useState<any>(null);
    const [revokeReason, setRevokeReason] = useState('');

    // Form State
    const [issueForm, setIssueForm] = useState({
        userId: '',
        moduleId: '',
        recipientType: 'volunteer'
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [volQuery, setVolQuery] = useState('');

    const { selectedOrganization } = useApp();

    // Queries
    const { data: certificatesData, isLoading: isLoadingCerts } = useQuery(['org-certificates'], () => api.listIssuedCertificates());
    const { data: volunteers } = useQuery(['org-volunteers', selectedOrganization?.id], () => api.listOrganizationVolunteers({ organization_id: selectedOrganization?.id }), { enabled: !!selectedOrganization?.id });
    const { data: modulesData } = useQuery(['training-modules'], () => api.listTrainingModules());
    const { data: organizationsData } = useQuery(['organizations'], () => api.listOrganizations(), { enabled: issueForm.recipientType === 'organization' });

    const certificates = useMemo(() => {
        const items = Array.isArray(certificatesData) ? certificatesData : (certificatesData as any)?.data ?? [];
        return items.filter((c: any) =>
            c.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            c.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            c.recipientOrganization?.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.fileName?.toLowerCase().includes(search.toLowerCase())
        );
    }, [certificatesData, search]);

    const modules = useMemo(() => {
        return Array.isArray(modulesData) ? modulesData : (modulesData as any)?.data ?? [];
    }, [modulesData]);

    const volData = useMemo(() => {
        const items = Array.isArray(volunteers) ? volunteers : (volunteers as any)?.data ?? [];
        return items.filter((v: any) =>
            (v.firstName?.toLowerCase() || '').includes(volQuery.toLowerCase()) ||
            (v.lastName?.toLowerCase() || '').includes(volQuery.toLowerCase()) ||
            (v.email?.toLowerCase() || '').includes(volQuery.toLowerCase())
        );
    }, [volunteers, volQuery]);

    const organizations = useMemo(() => {
        const items = Array.isArray(organizationsData) ? organizationsData : (organizationsData as any)?.data ?? [];
        return items;
    }, [organizationsData]);

    // Mutations
    const issueMutation = useMutation({
        mutationFn: (data: FormData) => api.issueCertificate(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['org-certificates']);
            toast({ title: 'Success', description: 'Certificate issued successfully' });
            setIsIssueModalOpen(false);
            setIssueForm({ userId: '', moduleId: '', recipientType: 'volunteer' });
            setSelectedFile(null);
        },
        onError: (err: any) => {
            console.error('Issue error:', err);
            toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to issue certificate', variant: 'destructive' });
        }
    });

    const revokeMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => api.revokeCertificate(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries(['org-certificates']);
            toast({ title: 'Success', description: 'Certificate revoked' });
            setIsRevokeModalOpen(false);
            setSelectedCert(null);
            setRevokeReason('');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to revoke certificate', variant: 'destructive' })
    });

    const handleIssue = () => {
        if (!issueForm.userId) {
            toast({ title: 'Validation Error', description: `Please select a ${issueForm.recipientType}`, variant: 'destructive' });
            return;
        }
        if (!selectedFile) {
            toast({ title: 'Validation Error', description: 'Please upload a certificate file', variant: 'destructive' });
            return;
        }

        const formData = new FormData();
        if (issueForm.recipientType === 'volunteer') {
            formData.append('userId', issueForm.userId);
        } else {
            formData.append('recipientOrgId', issueForm.userId); // Reusing userId field for selected org ID in the form state for simplicity, or I should be more explicit.
        }

        if (issueForm.moduleId && issueForm.moduleId !== 'none') {
            formData.append('moduleId', issueForm.moduleId);
        }
        formData.append('recipientType', issueForm.recipientType);
        formData.append('certificate_file', selectedFile);

        issueMutation.mutate(formData);
    };

    const handleRevoke = () => {
        if (!revokeReason) {
            toast({ title: 'Validation Error', description: 'Please provide a reason for revocation', variant: 'destructive' });
            return;
        }
        revokeMutation.mutate({ id: selectedCert.id, reason: revokeReason });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
                    <p className="text-sm text-gray-500">Issue and manage volunteer certifications</p>
                </div>
                <Button onClick={() => setIsIssueModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Issue Certificate
                </Button>
            </div>

            <Card className="border-none shadow-premium bg-white/80 backdrop-blur-md overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by volunteer or file name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-gray-50/50 border-gray-200 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                <TableHead className="font-semibold text-gray-600">Recipient</TableHead>
                                <TableHead className="font-semibold text-gray-600">Type</TableHead>
                                <TableHead className="font-semibold text-gray-600">File Name</TableHead>
                                <TableHead className="font-semibold text-gray-600">Training Module</TableHead>
                                <TableHead className="font-semibold text-gray-600">Issued At</TableHead>
                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingCerts ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">Loading certificates...</TableCell>
                                </TableRow>
                            ) : certificates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">No certificates issued yet</TableCell>
                                </TableRow>
                            ) : (
                                certificates.map((cert: any) => (
                                    <TableRow key={cert.id} className="hover:bg-gray-50/30 transition-colors">
                                        <TableCell>
                                            {cert.recipientType === 'organization' ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 flex items-center justify-center text-indigo-600 text-sm font-bold shadow-sm">
                                                        {cert.recipientOrganization?.name?.[0] || 'O'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{cert.recipientOrganization?.name}</p>
                                                        <p className="text-xs text-gray-500">Organization</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-sm font-bold shadow-sm">
                                                        {cert.user?.firstName?.[0] || 'V'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{cert.user?.firstName} {cert.user?.lastName}</p>
                                                        <p className="text-xs text-gray-500">{cert.user?.email}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {cert.recipientType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                <FileText className="h-4 w-4 text-gray-400" />
                                                <span className="truncate max-w-[150px]">{cert.fileName || 'Untitled'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {cert.module ? (
                                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 font-normal">
                                                    <Award className="h-3 w-3 mr-1" />
                                                    {cert.module.title}
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {cert.issuedAt || cert.created_at ? format(new Date(cert.issuedAt || cert.created_at), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={cert.status === 'active' ? 'outline' : 'destructive'}
                                                className={cn(
                                                    "capitalize",
                                                    cert.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                                )}
                                            >
                                                {cert.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary transition-colors" asChild>
                                                    <a href={`${import.meta.env.VITE_API_URL}/certificates/${cert.id}/download`} target="_blank" rel="noreferrer">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                {cert.status === 'active' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        onClick={() => {
                                                            setSelectedCert(cert);
                                                            setIsRevokeModalOpen(true);
                                                        }}
                                                    >
                                                        <ShieldAlert className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Issue Modal */}
            <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Award className="h-6 w-6 text-primary" />
                            Issue New Certificate
                        </DialogTitle>
                        <DialogDescription>Directly upload a certificate file for a volunteer or organization.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">1. Recipient Type</label>
                            <Select
                                value={issueForm.recipientType}
                                onValueChange={(val) => setIssueForm({ ...issueForm, recipientType: val, userId: '' })}
                            >
                                <SelectTrigger className="bg-gray-50/50 border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="volunteer">Volunteer</SelectItem>
                                    <SelectItem value="organization">Organization</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                2. Select {issueForm.recipientType === 'volunteer' ? 'Volunteer' : 'Organization'}
                            </label>
                            {issueForm.recipientType === 'volunteer' ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between bg-gray-50/50 border-gray-200 hover:bg-gray-50">
                                            {issueForm.userId ? (() => {
                                                const v = volData.find((v: any) => (v.id || v.user_id) === Number(issueForm.userId));
                                                if (!v) return "Search volunteers...";
                                                const name = `${v.firstName || ''} ${v.lastName || ''}`.trim();
                                                return name || v.email || "Unknown Volunteer";
                                            })() : "Search volunteers..."}
                                            <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[450px] p-0 shadow-xl border-gray-100">
                                        <Command>
                                            <CommandInput placeholder="Search name or email..." onValueChange={setVolQuery} className="border-none focus:ring-0" />
                                            <CommandList>
                                                <CommandGroup className="max-h-[200px] overflow-auto">
                                                    {volData.map((vol: any) => (
                                                        <CommandItem
                                                            key={vol.id || vol.user_id}
                                                            onSelect={() => setIssueForm({ ...issueForm, userId: String(vol.id || vol.user_id) })}
                                                            className="cursor-pointer hover:bg-primary/5 py-2 px-3"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                                                    {vol.firstName?.[0] || 'V'}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-sm">{vol.firstName || vol.lastName ? `${vol.firstName || ''} ${vol.lastName || ''}`.trim() : vol.email || 'Unknown'}</span>
                                                                    <span className="text-xs text-gray-500">{vol.email}</span>
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <Select value={issueForm.userId} onValueChange={(val) => setIssueForm({ ...issueForm, userId: val })}>
                                    <SelectTrigger className="bg-gray-50/50 border-gray-200">
                                        <SelectValue placeholder="Select an organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations.map((org: any) => (
                                            <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">3. Upload Certificate File (PDF/Image)</label>
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer",
                                    selectedFile ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                                )}
                                onClick={() => document.getElementById('cert-upload')?.click()}
                            >
                                {selectedFile ? (
                                    <div className="flex flex-col items-center">
                                        <FileText className="h-10 w-10 text-primary mb-2" />
                                        <p className="text-sm font-medium text-primary line-clamp-1 max-w-[200px]">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <Button variant="ghost" size="sm" className="mt-2 text-xs h-7" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>Change file</Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                        <p className="text-sm font-medium text-gray-600">Click to upload file</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                                    </div>
                                )}
                                <input
                                    id="cert-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">3. Linked Training Module (Optional)</label>
                            <Select value={issueForm.moduleId} onValueChange={(val) => setIssueForm({ ...issueForm, moduleId: val })}>
                                <SelectTrigger className="bg-gray-50/50 border-gray-200">
                                    <SelectValue placeholder="Select a module (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {Array.isArray(modules) && modules.map((m: any) => (
                                        <SelectItem key={m.id} value={String(m.id)}>{m.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button variant="ghost" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleIssue}
                            disabled={issueMutation.isLoading}
                            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            {issueMutation.isLoading ? "Issuing..." : "Issue Certificate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Modal */}
            <Dialog open={isRevokeModalOpen} onOpenChange={setIsRevokeModalOpen}>
                <DialogContent className="border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <ShieldAlert className="h-6 w-6" />
                            Revoke Certificate
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Are you sure you want to revoke the certificate for <strong>{selectedCert?.recipientType === 'organization' ? selectedCert?.recipientOrganization?.name : `${selectedCert?.user?.firstName || ''} ${selectedCert?.user?.lastName || ''}`.trim()}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Reason for Revocation</label>
                        <Input
                            placeholder="e.g. Expired, issued by mistake, misconduct..."
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            className="bg-gray-50/50 border-gray-200"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="ghost" onClick={() => setIsRevokeModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRevoke} disabled={revokeMutation.isLoading} className="shadow-lg shadow-red-200">
                            {revokeMutation.isLoading ? "Revoking..." : "Revoke Certificate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
