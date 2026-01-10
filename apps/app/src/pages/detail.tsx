import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
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
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Detail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [applyNotes, setApplyNotes] = useState('');

  // Fetch Opportunity Detail
  const { data: opportunity, isLoading, error } = useQuery(
    ['volunteer-opportunity', id],
    () => api.getVolunteerOpportunityDetail(Number(id)),
    {
      enabled: !!id,
      retry: 1,
    }
  );

  // Apply Mutation
  const applyMutation = useMutation(
    async () => {
      // Explicitly use the correct endpoint
      return axios.post(`/volunteer/opportunities/${id}/apply`, { notes: applyNotes });
    },
    {
      onSuccess: () => {
        toast({
          title: t('Application Submitted'),
          description: t('You have successfully applied for this opportunity.'),
        });
        queryClient.invalidateQueries(['volunteer-opportunity', id]);
        setApplyNotes(''); // Clear notes
      },
      onError: (err: any) => {
        toast({
          title: t('Application Failed'),
          description: err?.response?.data?.message || t('Could not submit application.'),
          variant: 'destructive',
        });
      },
    }
  );

  // Withdraw Mutation
  const withdrawMutation = useMutation(
    async () => {
      return axios.post(`/volunteer/opportunities/${id}/withdraw`);
    },
    {
      onSuccess: () => {
        toast({
          title: t('Application Withdrawn'),
          description: t('You have withdrawn from this opportunity.'),
        });
        queryClient.invalidateQueries(['volunteer-opportunity', id]);
      },
      onError: (err: any) => {
        toast({
          title: t('Withdrawal Failed'),
          description: err?.response?.data?.message || t('Could not withdraw application.'),
          variant: 'destructive',
        });
      },
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
          <img
            src={opportunity.image}
            alt={opportunity.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/5 to-background flex items-center justify-center">
            <Briefcase className="h-20 w-20 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" className="rounded-full shadow-lg backdrop-blur-md bg-background/50 hover:bg-background/80" onClick={() => navigate(-1)}>
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
                  <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium bg-primary/10 text-primary shadow-sm hover:bg-primary/20 transition-colors">
                    {opportunity.category || 'General'}
                  </Badge>
                  {opportunity.isVirtual && (
                    <Badge variant="outline" className="rounded-full border-primary/20 text-primary">
                      {t('Virtual Event')}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground shadow-sm">
                  {opportunity.title}
                </h1>
              </div>

              {/* Organization Mini-Card */}
              <Card className="border-border/50 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm overflow-hidden hover:bg-card transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                    <AvatarImage src={opportunity.organization?.logo} />
                    <AvatarFallback>{opportunity.organization?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('Organized by')}</p>
                    <h3 className="font-bold text-lg leading-none">{opportunity.organization?.name}</h3>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">{t('About this Opportunity')}</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                <p>{opportunity.description}</p>
              </CardContent>
            </Card>

            {/* Requirements / Skills */}
            {opportunity.skills && opportunity.skills.length > 0 && (
              <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{t('Skills & Requirements')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.skills.map((skill: string) => (
                      <Badge key={skill} variant="outline" className="px-3 py-1.5 text-sm rounded-lg border-primary/20 bg-primary/5">
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
            <Card className="border-border/50 shadow-lg shadow-primary/5 rounded-3xl overflow-hidden sticky top-24 bg-card">
              <CardHeader className="bg-muted/30 pb-6 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{t('Date & Time')}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg">
                        {/* TODO: Format date properly */}
                        {opportunity.startAt ? format(new Date(opportunity.startAt), 'MMM d, yyyy') : 'TBA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 pl-7 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {opportunity.startAt ? format(new Date(opportunity.startAt), 'h:mm a') : ''}
                        {opportunity.endAt ? ` - ${format(new Date(opportunity.endAt), 'h:mm a')}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('Location')}</p>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{opportunity.location || t('Virtual / Online')}</span>
                  </div>
                </div>

                {/* Map Preview */}
                {hasMapCoordinates && (
                  <div className="h-40 w-full rounded-xl overflow-hidden border border-border/50 relative">
                    <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                      <Marker position={position} />
                    </MapContainer>
                  </div>
                )}

                {/* Capacity */}
                {opportunity.capacity && (
                  <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Users className="h-4 w-4" />
                      <span>{t('Capacity')}</span>
                    </div>
                    <span className="font-bold">{opportunity.capacity} {t('spots')}</span>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                {isApplied ? (
                  <div className="space-y-3">
                    <Alert className={cn("border-l-4", isAccepted ? "border-l-emerald-500 bg-emerald-500/10" : "border-l-yellow-500 bg-yellow-500/10")}>
                      <div className="flex items-center gap-3">
                        {isAccepted ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Clock className="h-5 w-5 text-yellow-600" />}
                        <AlertTitle className={cn("mb-0 font-bold", isAccepted ? "text-emerald-900 dark:text-emerald-200" : "text-yellow-900 dark:text-yellow-200")}>
                          {isAccepted ? t('Application Accepted') : t('Application Pending')}
                        </AlertTitle>
                      </div>
                    </Alert>

                    <Button
                      variant="outline"
                      className="w-full border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                      onClick={() => withdrawMutation.mutate()}
                      disabled={withdrawMutation.isLoading}
                    >
                      {withdrawMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Loader2 className="h-4 w-4 mr-2 hidden" />}
                      {t('Withdraw Application')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('Note (Optional)')}</label>
                      <Textarea
                        placeholder={t('Introduce yourself or ask a question...')}
                        value={applyNotes}
                        onChange={(e) => setApplyNotes(e.target.value)}
                        className="bg-background resize-none h-24 text-sm"
                      />
                    </div>
                    <Button
                      size="lg"
                      className="w-full text-lg font-bold shadow-xl shadow-primary/20 rounded-xl"
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
