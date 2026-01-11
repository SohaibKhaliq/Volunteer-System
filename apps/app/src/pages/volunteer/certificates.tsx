import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, FileText, CheckCircle, Clock, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

export default function VolunteerCertificates() {
    const { t } = useTranslation();

    const { data: certificatesData, isLoading: isLoadingCerts } = useQuery({
        queryKey: ['my-certificates'],
        queryFn: () => api.getMyCertificates()
    });

    const { data: trainingData, isLoading: isLoadingTraining } = useQuery({
        queryKey: ['my-training'],
        queryFn: () => api.listVolunteerTraining()
    });

    const certificates = Array.isArray(certificatesData) ? certificatesData : (certificatesData as any)?.data ?? [];
    const trainingModules = Array.isArray(trainingData) ? trainingData : (trainingData as any)?.data ?? [];

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-10">
            {/* Header section with high-impact visuals */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award className="h-48 w-48" />
                </div>
                <div className="relative z-10 space-y-4 max-w-2xl">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md px-4 py-1.5 rounded-full font-bold">
                        {t('Certification Portfolio')}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                        {t('Recognized Impact')}
                    </h1>
                    <p className="text-lg md:text-xl text-indigo-100 font-medium leading-relaxed">
                        {t('Your certificates are a testament to your commitment and specialized skills. Keep track of your institutional recognition here.')}
                    </p>
                </div>
            </div>

            {/* Training Progress Overview */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                            {t('Educational Journey')}
                        </h2>
                        <p className="text-muted-foreground font-medium">{t('Track your progress through organization-certified training.')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoadingTraining ? (
                        [1, 2, 3].map(i => <div key={i} className="h-32 rounded-[2rem] bg-muted animate-pulse" />)
                    ) : trainingModules.length === 0 ? (
                        <Card className="col-span-full border-none bg-muted/30 p-8 text-center rounded-[2rem]">
                            <p className="text-muted-foreground font-medium">{t('No training modules assigned yet.')}</p>
                        </Card>
                    ) : (
                        trainingModules.map((item: any) => (
                            <Card key={item.id} className="group border-border/50 rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-black text-lg group-hover:text-indigo-600 transition-colors">{item.module?.title || item.title}</h3>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                                {item.organization?.name || t('Assigned Module')}
                                            </p>
                                        </div>
                                        <Badge variant={item.status === 'completed' ? 'default' : 'secondary'} className={cn(
                                            "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter",
                                            item.status === 'completed' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                                item.status === 'in_progress' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                    "bg-slate-100 text-slate-500"
                                        )}>
                                            {item.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-muted-foreground">{t('Curriculum Progress')}</span>
                                            <span className="text-indigo-600">{item.progress || 0}%</span>
                                        </div>
                                        <Progress value={item.progress || 0} className="h-2 rounded-full overflow-hidden" />
                                    </div>
                                    <div className="pt-2">
                                        <Button variant="ghost" size="sm" className="w-full rounded-xl font-bold h-10 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border border-transparent group-hover:border-indigo-100">
                                            {item.status === 'completed' ? t('Review Content') : t('Continue Learning')}
                                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Earned Certificates Grid */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        {t('Official Certifications')}
                    </h2>
                    <p className="text-muted-foreground font-medium">{t('Your verified achievements issued by registered organizations.')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoadingCerts ? (
                        [1, 2, 3].map(i => <div key={i} className="h-64 rounded-[2.5rem] bg-muted animate-pulse" />)
                    ) : certificates.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 rounded-[2.5rem] bg-card/10 backdrop-blur-sm">
                            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Award className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-black">{t('No certificates earned yet')}</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-medium">
                                {t('Complete training modules or participate in significant events to earn official recognition.')}
                            </p>
                        </div>
                    ) : (
                        certificates.map((cert: any) => (
                            <div key={cert.id} className="relative group transition-all duration-500 hover:-translate-y-2">
                                <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-xl group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] transition-all bg-white flex flex-col h-full border-t-8 border-t-emerald-500">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                                        <ShieldCheck className="h-32 w-32" />
                                    </div>
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                                                <Award className="h-7 w-7" />
                                            </div>
                                            <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-lg font-black text-[10px] tracking-wider uppercase">
                                                {cert.status || t('Verified')}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-2xl font-black leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                                            {cert.template?.name || t('Standard Certificate')}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                            <div className="flex -space-x-2">
                                                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center border border-white text-[8px] text-emerald-700 font-bold">
                                                    {cert.organization?.name?.[0] || 'O'}
                                                </div>
                                            </div>
                                            <span>{cert.organization?.name || t('Issuing Organization')}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 flex flex-col flex-1 justify-between gap-6">
                                        <div className="space-y-4 pt-4 border-t border-dashed">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground font-medium flex items-center gap-2">
                                                    <Clock className="h-4 w-4" /> {t('Issued Date')}
                                                </span>
                                                <span className="font-bold">{cert.issuedAt || cert.created_at ? format(new Date(cert.issuedAt || cert.created_at), 'MMM d, yyyy') : t('N/A')}</span>
                                            </div>
                                            {cert.module && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4" /> {t('Criteria')}
                                                    </span>
                                                    <span className="font-bold text-right line-clamp-1">{cert.module.title}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <Button className="flex-1 rounded-2xl h-12 font-black shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700" asChild>
                                                <a href={`${import.meta.env.VITE_API_URL}/volunteer/certificates/${cert.id}/download`} target="_blank" rel="noreferrer">
                                                    <Download className="mr-2 h-4 w-4" /> {t('Download')}
                                                </a>
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border/50 hover:bg-muted" asChild title={t('Public Verification Link')}>
                                                <a href={`/verify/${cert.id}`} target="_blank" rel="noreferrer">
                                                    <FileText className="h-5 w-5" />
                                                </a>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
