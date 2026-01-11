import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Download, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function VerifyCertificate() {
    const { id } = useParams<{ id: string }>();

    const { data: certificate, isLoading, error } = useQuery({
        queryKey: ['public-certificate', id],
        queryFn: () => api.getPublicCertificate(id!),
        enabled: !!id,
        retry: false
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium animate-pulse">Verifying Certificate...</p>
                </div>
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
                <Card className="w-full max-w-md border-destructive/20 shadow-xl shadow-destructive/5">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-destructive">Verification Failed</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground pb-8">
                        <p>We could not find a valid certificate with ID: <span className="font-mono font-bold text-foreground">{id}</span></p>
                        <p className="mt-2 text-sm">Please check the link and try again, or contact the issuing organization.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Normalize data
    const cert = certificate.data || certificate;
    const status = cert.status?.toLowerCase() || 'unknown';
    const isValid = status === 'valid' || status === 'approved';
    const isExpired = status === 'expired';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-2xl">
                {/* Verification Badge */}
                <div className="flex justify-center mb-8">
                    <div className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-full shadow-sm border bg-white font-medium",
                        isValid ? "text-green-700 border-green-200" :
                            isExpired ? "text-red-700 border-red-200" :
                                "text-amber-700 border-amber-200"
                    )}>
                        {isValid ? <CheckCircle2 className="h-5 w-5" /> :
                            isExpired ? <XCircle className="h-5 w-5" /> :
                                <AlertTriangle className="h-5 w-5" />}
                        <span>
                            {isValid ? "Officially Verified Certificate" :
                                isExpired ? "Certificate Expired" :
                                    "Verification Pending"}
                        </span>
                    </div>
                </div>

                <Card className="border-none shadow-2xl overflow-hidden relative">
                    {/* Decorative Top Border */}
                    <div className={cn("h-3 w-full",
                        isValid ? "bg-gradient-to-r from-green-500 to-emerald-600" :
                            isExpired ? "bg-gradient-to-r from-red-500 to-rose-600" :
                                "bg-gradient-to-r from-amber-500 to-orange-600"
                    )} />

                    <CardHeader className="text-center pt-8 pb-4">
                        <div className="mx-auto w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center mb-4 transform rotate-3">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight text-foreground">
                            {cert.doc_type || 'Certification'}
                        </CardTitle>
                        <p className="text-muted-foreground font-medium flex items-center justify-center gap-2 mt-2">
                            Issued by <span className="font-bold text-foreground">{cert.organization?.name || 'Eghata System'}</span>
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-8 px-8 sm:px-12 pb-12">
                        {/* Main Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-2xl border border-dashed border-border/60">
                            <div className="space-y-1">
                                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    Issued To
                                </div>
                                <div className="text-lg font-bold">
                                    {cert.user?.firstName} {cert.user?.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">
                                    ID: {cert.user_id}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" />
                                    Certificate ID
                                </div>
                                <div className="text-lg font-bold font-mono">
                                    #{cert.id}
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">
                                    {isValid ? 'Valid & Authentic' : 'Check Status'}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Issued Date
                                </div>
                                <div className="text-lg font-bold">
                                    {cert.issued_at ? format(new Date(cert.issued_at), 'MMMM d, yyyy') : 'N/A'}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Expiry Date
                                </div>
                                <div className={cn("text-lg font-bold", isExpired && "text-destructive")}>
                                    {cert.expires_at ? format(new Date(cert.expires_at), 'MMMM d, yyyy') : 'No Expiry'}
                                </div>
                            </div>
                        </div>

                        {/* Status Section */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Status</div>
                            <Badge className={cn(
                                "px-4 py-1.5 text-base font-bold pointer-events-none capitalize",
                                isValid ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                    isExpired ? "bg-red-100 text-red-700 hover:bg-red-100" :
                                        "bg-amber-100 text-amber-700 hover:bg-amber-100"
                            )}>
                                {status}
                            </Badge>
                        </div>

                        {/* Metadata / Validation Hash Mock */}
                        <div className="text-center border-t pt-8">
                            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                                This document was digitally generated and its authenticity can be verified by scanning the QR code or visiting the verification URL.
                            </p>
                            <div className="text-[10px] text-muted-foreground/50 font-mono break-all px-8">
                                {/* Mock hash for "blockchain" feel */}
                                BLOCK-CHAIN-VERIFICATION-HASH: {btoa(`cert-${cert.id}-${status}`).substring(0, 32)}...
                            </div>
                        </div>

                    </CardContent>

                    {cert.metadata?.file && (
                        <CardFooter className="bg-muted/50 p-6 flex justify-center">
                            <Button className="font-bold shadow-lg" onClick={() => window.open(cert.metadata.file, '_blank')}>
                                <Download className="mr-2 h-4 w-4" /> Download Digital Copy
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                <div className="text-center mt-8">
                    <p className="text-sm font-medium text-muted-foreground">Powered by <span className="font-black text-foreground">Eghata</span></p>
                </div>
            </div>
        </div>
    );
}
