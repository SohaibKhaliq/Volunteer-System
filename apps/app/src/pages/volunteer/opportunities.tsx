import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  MapPin,
  Building2,
  Users,
  Clock,
  Search,
  Filter,
  BookmarkIcon,
  BookmarkCheck,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const VolunteerOpportunitiesPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState('start_at');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [applicationNotes, setApplicationNotes] = useState('');

  // Fetch opportunities
  const { data: opportunitiesData, isLoading } = useQuery({
    queryKey: ['browse-opportunities', search, city, sortBy],
    queryFn: async () => {
      try {
        const params: any = { perPage: 50, sortBy };
        if (search) params.search = search;
        if (city) params.city = city;
        const res = await api.browseOpportunities(params);
        return (res as any)?.data || [];
      } catch {
        // Fallback to public organizations opportunities
        try {
          const res = await api.getPublicOrganizations({ perPage: 10 });
          return [];
        } catch {
          return [];
        }
      }
    }
  });

  // Fetch bookmarked opportunities
  const { data: bookmarksData } = useQuery({
    queryKey: ['bookmarked-opportunities'],
    queryFn: async () => {
      try {
        const res = await api.getBookmarkedOpportunities();
        return (res as any)?.opportunities?.map((o: any) => o.id) || [];
      } catch {
        return [];
      }
    }
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: (opportunityId: number) => api.applyToOpportunity(opportunityId, applicationNotes),
    onSuccess: () => {
      toast.success(t('Application submitted successfully!'));
      setApplyDialogOpen(false);
      setApplicationNotes('');
      queryClient.invalidateQueries({ queryKey: ['browse-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-applications'] });
    },
    onError: () => {
      toast.error(t('Failed to submit application'));
    }
  });

  // Bookmark mutations
  const bookmarkMutation = useMutation({
    mutationFn: (id: number) => api.bookmarkOpportunity(id),
    onSuccess: () => {
      toast.success(t('Opportunity bookmarked'));
      queryClient.invalidateQueries({ queryKey: ['bookmarked-opportunities'] });
    }
  });

  const unbookmarkMutation = useMutation({
    mutationFn: (id: number) => api.unbookmarkOpportunity(id),
    onSuccess: () => {
      toast.success(t('Bookmark removed'));
      queryClient.invalidateQueries({ queryKey: ['bookmarked-opportunities'] });
    }
  });

  const opportunities = opportunitiesData || [];
  const bookmarkedIds = bookmarksData || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApply = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setApplyDialogOpen(true);
  };

  const submitApplication = () => {
    if (selectedOpportunity) {
      applyMutation.mutate(selectedOpportunity.id);
    }
  };

  const toggleBookmark = (id: number) => {
    if (bookmarkedIds.includes(id)) {
      unbookmarkMutation.mutate(id);
    } else {
      bookmarkMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('Browse Opportunities')}</h1>
        <p className="text-slate-600">{t('Find volunteer opportunities that match your interests and availability.')}</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search opportunities...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder={t('City or location')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="md:w-48"
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder={t('Sort by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start_at">{t('Date (Soonest)')}</SelectItem>
                <SelectItem value="title">{t('Title (A-Z)')}</SelectItem>
                <SelectItem value="created_at">{t('Newest First')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : opportunities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">{t('No opportunities found')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('Try adjusting your search filters or check back later.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp: any) => (
            <Card key={opp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Bookmark button */}
                <button
                  onClick={() => toggleBookmark(opp.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                >
                  {bookmarkedIds.includes(opp.id) ? (
                    <BookmarkCheck className="h-4 w-4 text-white" />
                  ) : (
                    <BookmarkIcon className="h-4 w-4 text-white" />
                  )}
                </button>

                {/* Organization badge */}
                {opp.organization && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      {opp.organization.name}
                    </Badge>
                  </div>
                )}

                {/* Title */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-semibold text-lg line-clamp-1">{opp.title}</h3>
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {opp.description || t('No description available')}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(opp.startAt || opp.start_at)}</span>
                    {(opp.startAt || opp.start_at) && (
                      <span className="text-xs">at {formatTime(opp.startAt || opp.start_at)}</span>
                    )}
                  </div>
                  
                  {opp.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{opp.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {opp.capacity && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{opp.capacity} spots</span>
                      </div>
                    )}
                    {(opp.startAt || opp.start_at) && (opp.endAt || opp.end_at) && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {Math.round(
                            (new Date(opp.endAt || opp.end_at).getTime() - 
                             new Date(opp.startAt || opp.start_at).getTime()) / 3600000
                          )}h
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleApply(opp)}
                    disabled={opp.userApplicationStatus === 'applied' || opp.userApplicationStatus === 'accepted'}
                  >
                    {opp.userApplicationStatus === 'applied' ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        {t('Pending')}
                      </>
                    ) : opp.userApplicationStatus === 'accepted' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('Accepted')}
                      </>
                    ) : (
                      t('Apply Now')
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Apply for Opportunity')}</DialogTitle>
            <DialogDescription>
              {selectedOpportunity?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              {selectedOpportunity?.organization && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {selectedOpportunity.organization.name}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(selectedOpportunity?.startAt || selectedOpportunity?.start_at)}
              </div>
              {selectedOpportunity?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedOpportunity.location}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">{t('Why are you interested? (Optional)')}</label>
              <Textarea
                placeholder={t('Tell the organization why you want to volunteer...')}
                value={applicationNotes}
                onChange={(e) => setApplicationNotes(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={submitApplication} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('Submitting...')}
                </>
              ) : (
                t('Submit Application')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VolunteerOpportunitiesPage;
