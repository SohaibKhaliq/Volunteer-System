// no default React namespace required in this file
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MapPin, Users, Clock, Calendar, Globe, ArrowLeft, MessageSquare } from 'lucide-react';

interface OrganizationDetail {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  logo_thumb?: string;
  website?: string;
  city?: string;
  country?: string;
  type?: string;
  stats: {
    volunteers: number;
    events: number;
    totalHours: number;
  };
}

interface Opportunity {
  id: number;
  title: string;
  slug: string;
  description?: string;
  location?: string;
  capacity: number;
  type: string;
  startAt: string;
  endAt?: string;
  team?: { id: number; name: string };
}

export default function PublicOrganizationDetail() {
  const navigate = useNavigate();
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const effectiveSlug = slug || id;

  // Fetch organization details
  const {
    data: orgData,
    isLoading: isOrgLoading,
    error
  } = useQuery({
    queryKey: ['publicOrganization', effectiveSlug],
    queryFn: () => api.getPublicOrganization(effectiveSlug!),
    enabled: !!effectiveSlug
  });

  // Fetch opportunities
  const { data: oppsData, isLoading: isOppsLoading } = useQuery({
    queryKey: ['publicOrganizationOpportunities', effectiveSlug],
    queryFn: () => api.getPublicOrganizationOpportunities(effectiveSlug!, { upcoming: 'true', limit: 6 }),
    enabled: !!effectiveSlug
  });

  if (isOrgLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !orgData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Organization Not Found</h3>
            <p className="text-muted-foreground mb-4">This organization doesn&apos;t exist or is not public.</p>
            <Link to="/organizations">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Organizations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const org: OrganizationDetail = orgData;
  const opportunities: Opportunity[] = oppsData?.data || [];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back button */}
      <Link to="/organizations" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Organizations
      </Link>

      {/* Organization Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={org.logo} />
              <AvatarFallback className="text-4xl">{org.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">{org.name}</h1>
                  {org.city && (
                    <div className="flex items-center text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      {org.city}
                      {org.country && `, ${org.country}`}
                    </div>
                  )}
                  {org.type && (
                    <Badge variant="secondary" className="mb-4">
                      {org.type}
                    </Badge>
                  )}
                </div>
                {org.website && (
                  <div className="flex gap-2">
                    <a href={org.website} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                      onClick={() => navigate(`/profile?tab=messages&orgId=${org.id}`)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </Button>
                  </div>
                )}
                {!org.website && (
                  <Button
                    variant="outline"
                    className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                    onClick={() => navigate(`/profile?tab=messages&orgId=${org.id}`)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground">{org.description || 'No description available.'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volunteers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.stats.volunteers}</div>
            <p className="text-xs text-muted-foreground">Active volunteers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.stats.events}</div>
            <p className="text-xs text-muted-foreground">Total events organized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.stats.totalHours.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Hours contributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Opportunities */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Upcoming Opportunities</h2>
        {isOppsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : opportunities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Opportunities</h3>
              <p className="text-muted-foreground">Check back later for new volunteer opportunities.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const startDate = new Date(opportunity.startAt);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{opportunity.title}</CardTitle>
          <Badge variant="outline">{opportunity.type}</Badge>
        </div>
        {opportunity.team && <CardDescription>{opportunity.team.name}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            {startDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
          {opportunity.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {opportunity.location}
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            {opportunity.capacity} spots available
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {opportunity.description || 'No description available.'}
        </p>
        <Button className="w-full">Apply Now</Button>
      </CardContent>
    </Card>
  );
}
