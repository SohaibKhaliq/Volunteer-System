import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, Download, Search, FileText, User, ShieldAlert } from 'lucide-react';
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
        templateId: '',
        moduleId: ''
    });

    const [volQuery, setVolQuery] = useState('');

    const { selectedOrganization } = useApp();

    // Queries
    const { data: certificatesData, isLoading: isLoadingCerts } = useQuery(['org-certificates'], () => api.listIssuedCertificates());
    const { data: volunteers } = useQuery(['org-volunteers', selectedOrganization?.id], () => api.listOrganizationVolunteers({ organization_id: selectedOrganization?.id }), { enabled: !!selectedOrganization?.id });
    const { data: templatesData } = useQuery(['cert-templates'], () => api.list('organization/certificate-templates'));
    const { data: modulesData } = useQuery(['training-modules'], () => api.listTrainingModules());

    const certificates = useMemo(() => {
        const items = Array.isArray(certificatesData) ? certificatesData : (certificatesData as any)?.data ?? [];
        return items.filter((c: any) =>
            c.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            c.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            c.template?.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [certificatesData, search]);

    const modules = useMemo(() => {
        return Array.isArray(modulesData) ? modulesData : (modulesData as any)?.data ?? [];
    }, [modulesData]);

    const templates = useMemo(() => {
        return Array.isArray(templatesData) ? templatesData : (templatesData as any)?.data ?? [];
    }, [templatesData]);

    const volData = useMemo(() => {
        const items = Array.isArray(volunteers) ? volunteers : (volunteers as any)?.data ?? [];
        return items.filter((v: any) =>
            (v.firstName?.toLowerCase() || '').includes(volQuery.toLowerCase()) ||
            (v.lastName?.toLowerCase() || '').includes(volQuery.toLowerCase()) ||
            (v.email?.toLowerCase() || '').includes(volQuery.toLowerCase())
        );
    }, [volunteers, volQuery]);

    // Mutations
    const issueMutation = useMutation({
        mutationFn: (data: any) => api.issueCertificate(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['org-certificates']);
            toast({ title: 'Success', description: 'Certificate issued successfully' });
            setIsIssueModalOpen(false);
            setIssueForm({ userId: '', templateId: '', moduleId: '' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to issue certificate', variant: 'destructive' })
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
        if (!issueForm.userId || !issueForm.templateId) {
            toast({ title: 'Validation Error', description: 'Please select a volunteer and a template', variant: 'destructive' });
            return;
        }
        issueMutation.mutate(issueForm);
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

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by volunteer or template..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Volunteer</TableHead>
                                <TableHead>Certificate Template</TableHead>
                                <TableHead>Training Module</TableHead>
                                <TableHead>Issued At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                    <TableRow key={cert.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                                                    {cert.user?.firstName?.[0] || 'V'}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{cert.user?.firstName} {cert.user?.lastName}</p>
                                                    <p className="text-xs text-gray-500">{cert.user?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                                {cert.template?.name || 'Standard Template'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {cert.module ? (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Award className="h-3.5 w-3.5 text-amber-500" />
                                                    {cert.module.title}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {cert.issuedAt || cert.created_at ? format(new Date(cert.issuedAt || cert.created_at), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={cert.status === 'active' ? 'outline' : 'destructive'} className={cn(cert.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : '')}>
                                                {cert.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" title="Download" asChild>
                                                    <a href={`${import.meta.env.VITE_API_URL}/volunteer/certificates/${cert.id}/download`} target="_blank" rel="noreferrer">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                {cert.status === 'active' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Issue New Certificate</DialogTitle>
                        <DialogDescription>Award a certificate to a volunteer for their achievements or training completion.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Volunteer</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {issueForm.userId ? (() => {
                                            const v = volData.find((v: any) => (v.id || v.user_id) === Number(issueForm.userId));
                                            if (!v) return "Search volunteers...";
                                            if (v.firstName || v.lastName) return `${v.firstName || ''} ${v.lastName || ''}`.trim();
                                            return v.email || "Unknown Volunteer";
                                        })() : "Search volunteers..."}
                                        <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[450px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search name or email..." onValueChange={setVolQuery} />
                                        <CommandList>
                                            <CommandGroup className="max-h-[200px] overflow-auto">
                                                {volData.map((vol: any) => (
                                                    <CommandItem
                                                        key={vol.id || vol.user_id}
                                                        onSelect={() => setIssueForm({ ...issueForm, userId: String(vol.id || vol.user_id) })}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{vol.firstName || vol.lastName ? `${vol.firstName || ''} ${vol.lastName || ''}`.trim() : vol.email || 'Unknown'}</span>
                                                            <span className="text-xs text-gray-500">{vol.email}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Certificate Design (Template)</label>
                            <Select value={issueForm.templateId} onValueChange={(val) => setIssueForm({ ...issueForm, templateId: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(templates) && templates.map((t: any) => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Linked Training Module (Optional)</label>
                            <Select value={issueForm.moduleId} onValueChange={(val) => setIssueForm({ ...issueForm, moduleId: val })}>
                                <SelectTrigger>
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
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleIssue} disabled={issueMutation.isLoading}>
                            {issueMutation.isLoading ? "Issuing..." : "Issue Certificate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Modal */}
            <Dialog open={isRevokeModalOpen} onOpenChange={setIsRevokeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Revoke Certificate</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke the certificate for <strong>{selectedCert?.user?.firstName} {selectedCert?.user?.lastName}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Reason for Revocation</label>
                        <Input
                            placeholder="e.g. Expired, issued by mistake, misconduct..."
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRevokeModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRevoke} disabled={revokeMutation.isLoading}>
                            {revokeMutation.isLoading ? "Revoking..." : "Revoke Certificate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
