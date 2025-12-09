import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import volunteerApi from '@/lib/api/volunteerApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  MapPin,
  Building2,
  Users,
  Clock,
  Camera,
  CheckCircle,
  ArrowLeft,
  Bookmark,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import QRScanner from '@/components/molecules/qr-scanner';
import { format } from 'date-fns';

/**
 * Volunteer Opportunity Detail Page
 * Shows full opportunity details with QR check-in capability
 */
export default function VolunteerOpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [applicationNotes, setApplicationNotes] = useState('');

  // Fetch opportunity detail
  const { data: opportunity, isLoading } = useQuery({
    queryKey: ['volunteer', 'opportunity', id],
    queryFn: () => volunteerApi.getOpportunityDetail(Number(id)),
    enabled: !!id
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: () => volunteerApi.applyToOpportunity(Number(id), applicationNotes),
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      setApplyDialogOpen(false);
      setApplicationNotes('');
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'applications'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit application');
    }
  });

  // QR Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: volunteerApi.qrCheckIn,
    onSuccess: () => {
      toast.success('Checked in successfully! 🎉');
      setQrScannerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'attendance'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Invalid QR code or check-in failed');
    }
  });

  // Bookmark mutations
  const bookmarkMutation = useMutation({
    mutationFn: () => volunteerApi.bookmarkOpportunity(Number(id)),
    onSuccess: () => {
      toast.success('Opportunity bookmarked');
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'bookmarks'] });
    }
  });

  const unbookmarkMutation = useMutation({
    mutationFn: () => volunteerApi.unbookmarkOpportunity(Number(id)),
    onSuccess: () => {
      toast.success('Bookmark removed');
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'bookmarks'] });
    }
  });

  const handleShare = async () => {
    const shareData = {
      title: opportunity?.title || 'Volunteer Opportunity',
      text: opportunity?.description || 'Check out this volunteer opportunity!',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleQRScan = (code: string) => {
    checkInMutation.mutate(code);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Back button skeleton */}
        <Skeleton className="h-10 w-48" />

        {/* Hero Card skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="flex gap-3">
              <Skeleton className="h-11 flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="container mx-auto p-4 md:p-6 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Opportunity not found</h2>
          <Button onClick={() => navigate('/volunteer/opportunities')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
      </div>
    );
  }

  const opp = opportunity as any;
  const isApplied = opp.applicationStatus === 'applied' || opp.userApplicationStatus === 'applied';
  const isAccepted = opp.applicationStatus === 'accepted' || opp.userApplicationStatus === 'accepted';
  const isBookmarked = opp.isBookmarked || opp.bookmarked;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <Link to="/volunteer/opportunities" className="inline-flex items-center hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Opportunities
        </Link>
        <span className="text-muted-foreground">/</span>
        <div aria-current="page" className="font-medium truncate">
          {opp?.title || 'Opportunity'}
        </div>
      </div>

      {/* Hero Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <CardTitle className="text-3xl">{opp.title}</CardTitle>
              {opp.organization && (
                <CardDescription className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                  {opp.organization.name || opp.organizationName}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => (isBookmarked ? unbookmarkMutation.mutate() : bookmarkMutation.mutate())}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this opportunity'}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare} aria-label="Share this opportunity">
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {isApplied && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                Application Pending
              </Badge>
            )}
            {isAccepted && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Accepted
              </Badge>
            )}
            {opp.status && <Badge variant={opp.status === 'active' ? 'default' : 'secondary'}>{opp.status}</Badge>}
          </div>

          {/* Key details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {opp.startAt && format(new Date(opp.startAt), 'PPP p')}
                  {!opp.startAt && opp.start_at && format(new Date(opp.start_at), 'PPP p')}
                </p>
              </div>
            </div>

            {opp.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{opp.location}</p>
                </div>
              </div>
            )}

            {opp.slots && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Available Slots</p>
                  <p className="text-sm text-muted-foreground">{opp.slotsAvailable || opp.slots} spots</p>
                </div>
              </div>
            )}

            {opp.duration && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{opp.duration} hours</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          {opp.description && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">About This Opportunity</h3>
              <p className="text-muted-foreground whitespace-pre-line">{opp.description}</p>
            </div>
          )}

          {/* Requirements */}
          {opp.requirements && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Requirements</h3>
              <p className="text-muted-foreground whitespace-pre-line">{opp.requirements}</p>
            </div>
          )}

          {/* Skills */}
          {opp.skills && opp.skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {opp.skills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isApplied && !isAccepted && (
              <Button
                className="flex-1"
                onClick={() => setApplyDialogOpen(true)}
                aria-label="Apply for this opportunity"
              >
                Apply Now
              </Button>
            )}

            {isAccepted && (
              <Button
                className="flex-1"
                onClick={() => setQrScannerOpen(true)}
                aria-label="Check in using QR code scanner"
              >
                <Camera className="h-4 w-4 mr-2" aria-hidden="true" />
                Check In with QR
              </Button>
            )}

            {isApplied && (
              <Button className="flex-1" disabled aria-label="Application is pending review">
                <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
                Application Pending
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Opportunity</DialogTitle>
            <DialogDescription>{opp.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="application-notes" className="text-sm font-medium">
                Why are you interested? (Optional)
              </label>
              <Textarea
                id="application-notes"
                placeholder="Tell us about your interest and relevant experience..."
                value={applicationNotes}
                onChange={(e) => setApplicationNotes(e.target.value)}
                rows={4}
                className="mt-2"
                aria-describedby="notes-hint"
                maxLength={500}
              />
              <p id="notes-hint" className="text-xs text-muted-foreground mt-1">
                {applicationNotes.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                aria-label="Submit application"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner */}
      <QRScanner isOpen={qrScannerOpen} onScan={handleQRScan} onClose={() => setQrScannerOpen(false)} />
    </div>
  );
}
