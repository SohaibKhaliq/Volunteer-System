import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, MapPin, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PublicOrganization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  logo_thumb?: string;
  city?: string;
  country?: string;
  type?: string;
}

interface OrganizationStats {
  volunteers: number;
  events: number;
  totalHours: number;
}

export default function PublicOrganizations() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  // Fetch organizations
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['publicOrganizations', search, city, country, type, page],
    queryFn: () =>
      api.getPublicOrganizations({
        search: search || undefined,
        city: city || undefined,
        country: country || undefined,
        type: type || undefined,
        page,
        limit: 12
      })
  });

  // Fetch filter options
  const { data: citiesData } = useQuery({
    queryKey: ['publicOrgCities'],
    queryFn: () => api.getPublicOrganizationCities()
  });

  const { data: countriesData } = useQuery({
    queryKey: ['publicOrgCountries'],
    queryFn: () => api.getPublicOrganizationCountries()
  });

  const { data: typesData } = useQuery({
    queryKey: ['publicOrgTypes'],
    queryFn: () => api.getPublicOrganizationTypes()
  });

  const organizations: PublicOrganization[] = orgsData?.data?.data || orgsData?.data || [];
  const meta = orgsData?.data?.meta || {};
  const cities: string[] = citiesData?.data || [];
  const countries: string[] = countriesData?.data || [];
  const types: string[] = typesData?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCity('');
    setCountry('');
    setType('');
    setPage(1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Volunteer Organizations</h1>
        <p className="text-muted-foreground text-lg">
          Discover organizations making a difference in communities around the world.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
            {(search || city || country || type) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {organizations.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
          </div>

          {/* Pagination */}
          {meta.lastPage > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {meta.lastPage}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                disabled={page === meta.lastPage}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrganizationCard({ organization }: { organization: PublicOrganization }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={organization.logo_thumb || organization.logo} />
            <AvatarFallback className="text-lg">{organization.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{organization.name}</CardTitle>
            {organization.city && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {organization.city}
                {organization.country && `, ${organization.country}`}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {organization.type && (
          <Badge variant="secondary" className="mb-2">
            {organization.type}
          </Badge>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {organization.description || 'No description available.'}
        </p>
        <Link to={`/organizations/${organization.slug}`}>
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Organization
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
