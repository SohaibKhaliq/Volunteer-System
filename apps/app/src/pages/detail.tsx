import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { axios } from '@/lib/axios';
import api from '@/lib/api';
import { format } from 'date-fns';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/atoms/use-toast';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Users,
  AlertCircle,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix Leaflet Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Detail() {
  const { t } = useTranslation();
  const { id, type } = useParams();
  const location = useLocation();
  const isEvent = type === 'event' || location.pathname.startsWith('/events/');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [applyNotes, setApplyNotes] = useState('');

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Default fallback
      navigate(isEvent ? '/' : '/volunteer/opportunities');
    }
  };

  // Fetch Opportunity Detail
  const {
    data: rawOpportunity,
    isLoading,
    error
  } = useQuery(
    [isEvent ? 'event' : 'volunteer-opportunity', id],
    () => (isEvent ? api.getEvent(Number(id)) : api.getVolunteerOpportunityDetail(Number(id))),
    {
      enabled: !!id,
      retry: 1
    }
  );

  // Normalize data as 'opportunity' for the rest of the component
  const opportunity = rawOpportunity;

  // Apply Mutation
  const applyMutation = useMutation(
    async () => {
      // Guard: don't attempt to apply if we already have an application status
      if (opportunity?.userApplicationStatus && opportunity.userApplicationStatus !== 'withdrawn') {
        // Make the rejection shape similar to axios error so onError can pick up message
        throw { response: { data: { message: t('You have already applied to this event/opportunity.') } } };
      }

      // For events, we might need a different join/apply endpoint if they aren't unified
      const endpoint = isEvent ? `/events/${id}/join` : `/volunteer/opportunities/${id}/apply`;
      return axios.post(endpoint, { notes: applyNotes });
    },
    {
      onSuccess: () => {
        toast({
          title: t('Application Submitted'),
          description: t('You have successfully applied.')
        });
        queryClient.invalidateQueries([isEvent ? 'event' : 'volunteer-opportunity', id]);
        setApplyNotes(''); // Clear notes
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || t('Could not submit application.');
        toast({
          title: t('Application Failed'),
          description: message,
          variant: 'destructive'
        });
      }
    }
  );

  // Withdraw Mutation
  const withdrawMutation = useMutation(
    async () => {
      const endpoint = isEvent ? `/events/${id}/withdraw` : `/volunteer/opportunities/${id}/withdraw`;
      return axios.post(endpoint);
    },
    {
      onSuccess: () => {
        toast({
          title: t('Withdrawn Successfully'),
          description: t('Successfully withdrawn.')
        });
        queryClient.invalidateQueries([isEvent ? 'event' : 'volunteer-opportunity', id]);
      },
      onError: (err: any) => {
        toast({
          title: t('Withdrawal Failed'),
          description: err?.response?.data?.message || t('Could not withdraw.'),
          variant: 'destructive'
        });
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">{t('Opportunity not found')}</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('Go Back')}
        </Button>
      </div>
    );
  }

  // Parse location for map if available
  const hasMapCoordinates = opportunity.latitude && opportunity.longitude;
  const position: [number, number] = hasMapCoordinates
    ? [parseFloat(opportunity.latitude), parseFloat(opportunity.longitude)]
    : [-33.8688, 151.2093]; // Default Sydney

  const isApplied = ['applied', 'accepted', 'waitlisted'].includes(opportunity.userApplicationStatus);
  const isAccepted = opportunity.userApplicationStatus === 'accepted';

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-muted">
        {opportunity.image ? (
          <img src={opportunity.image} alt={opportunity.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/5 to-background flex items-center justify-center">
            <Briefcase className="h-20 w-20 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-lg shadow-lg backdrop-blur-md bg-background/50 hover:bg-background/80"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('Back')}
          </Button>
        </div>
      </div>

      <div className="container px-4 mx-auto -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left Col) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Card */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary shadow-sm hover:bg-primary/20 transition-colors"
                  >
                    {opportunity.category || 'General'}
                  </Badge>
                  {opportunity.isVirtual && (
                    <Badge
                      variant="outline"
                      className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary"
                    >
                      {t('Virtual Event')}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">{opportunity.title}</h1>
              </div>

              {/* Organization Mini-Card */}
              <Card className="border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-xl bg-card overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <CardContent className="p-6 flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-4 border-background shadow-xl rounded-full">
                    <AvatarImage src={opportunity.organization?.logo} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold">
                      {opportunity.organization?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                      {t('Organized by')}
                    </p>
                    <h3 className="font-bold text-xl leading-none">{opportunity.organization?.name}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-xl overflow-hidden bg-card">
              <CardHeader className="p-8 pb-4 border-b border-border bg-slate-50/50 dark:bg-slate-950/50">
                <CardTitle className="text-xl font-bold tracking-tight">{t('About this Opportunity')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                <p className="text-base">{opportunity.description}</p>
              </CardContent>
            </Card>

            {/* Requirements / Skills */}
            {opportunity.skills && opportunity.skills.length > 0 && (
              <Card className="border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-xl overflow-hidden bg-card">
                <CardHeader className="p-8 pb-4 border-b border-border bg-slate-50/50 dark:bg-slate-950/50">
                  <CardTitle className="text-xl font-bold tracking-tight">{t('Skills & Requirements')}</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex flex-wrap gap-2">
                    {opportunity.skills.map((skill: string) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border-primary/20 bg-primary/5 text-primary"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shifts (if applicable) */}
            {/* Assuming `shifts` might be in opportunity object or fetched separately. For now, specific shift logic can be added if needed. */}
          </div>

          {/* Sidebar (Right Col) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Action Card */}
            <Card className="border-border shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-xl overflow-hidden sticky top-24 bg-card">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-6 border-b border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                      {t('Date & Time')}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-xl tracking-tight">
                        {opportunity.startAt ? format(new Date(opportunity.startAt), 'MMM d, yyyy') : 'TBA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3 pl-1.5 text-muted-foreground">
                      <div className="w-10 flex justify-center">
                        <Clock className="h-4 w-4 opacity-50" />
                      </div>
                      <span className="text-sm font-medium">
                        {opportunity.startAt ? format(new Date(opportunity.startAt), 'h:mm a') : ''}
                        {opportunity.endAt ? ` - ${format(new Date(opportunity.endAt), 'h:mm a')}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-8">
                {/* Location */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {t('Location')}
                  </p>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border group hover:border-primary/20 transition-colors">
                    <MapPin className="h-5 w-5 text-primary shrink-0 transition-colors group-hover:scale-110" />
                    <span className="text-sm font-bold tracking-tight">
                      {opportunity.location || t('Virtual / Online')}
                    </span>
                  </div>
                </div>

                {/* Map Preview */}
                {hasMapCoordinates && (
                  <div className="h-48 w-full rounded-xl overflow-hidden border border-border relative shadow-inner">
                    <MapContainer
                      center={position}
                      zoom={13}
                      scrollWheelZoom={false}
                      className="h-full w-full grayscale-[0.5] contrast-[1.1]"
                    >
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                      <Marker position={position} />
                    </MapContainer>
                  </div>
                )}

                {/* Capacity */}
                {opportunity.capacity && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        {t('Capacity')}
                      </span>
                    </div>
                    <span className="font-bold text-lg">
                      {opportunity.capacity} {t('spots')}
                    </span>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                {isApplied ? (
                  <div className="space-y-4">
                    <Alert
                      className={cn(
                        'border border-border rounded-xl',
                        isAccepted ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-yellow-50 dark:bg-yellow-950/20'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center',
                            isAccepted ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
                          )}
                        >
                          {isAccepted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <AlertTitle
                            className={cn(
                              'mb-0 font-bold text-lg tracking-tight',
                              isAccepted
                                ? 'text-emerald-900 dark:text-emerald-200'
                                : 'text-yellow-900 dark:text-yellow-200'
                            )}
                          >
                            {isAccepted ? t('Application Accepted') : t('Application Pending')}
                          </AlertTitle>
                        </div>
                      </div>
                    </Alert>

                    <Button
                      variant="outline"
                      className="w-full h-12 font-bold rounded-lg border-destructive/20 hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300"
                      onClick={() => withdrawMutation.mutate()}
                      disabled={withdrawMutation.isLoading}
                    >
                      {withdrawMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {t('Withdraw Application')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                        {t('Note (Optional)')}
                      </label>
                      <Textarea
                        placeholder={t('Introduce yourself or ask a question...')}
                        value={applyNotes}
                        onChange={(e) => setApplyNotes(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border-border focus:bg-background transition-colors rounded-lg resize-none h-28 text-sm p-4"
                      />
                    </div>
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-lg group"
                      onClick={() => applyMutation.mutate()}
                      disabled={applyMutation.isLoading}
                    >
                      {applyMutation.isLoading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                      {t('Apply Now')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
