import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Navigation,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';

interface GeolocationCheckInProps {
  opportunityId: number;
  opportunityTitle?: string;
  requiredLocation?: {
    latitude: number;
    longitude: number;
  };
  onSuccess?: () => void;
}

export default function GeolocationCheckIn({
  opportunityId,
  opportunityTitle = 'this opportunity',
  requiredLocation,
  onSuccess
}: GeolocationCheckInProps) {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');
  const [requiresException, setRequiresException] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!location) {
        throw new Error('Location not available');
      }

      return await api.checkInToOpportunity(opportunityId, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        exceptionReason: requiresException ? exceptionReason : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', opportunityId] });
      toast({
        title: 'Checked in successfully',
        description: `You have checked in to ${opportunityTitle}`
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorData = error?.response?.data;
      
      // Check if we need an exception reason
      if (errorData?.requiresException) {
        setRequiresException(true);
        toast({
          title: 'Exception required',
          description: errorData.message || 'You are outside the shift location. Please provide a reason.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Check-in failed',
          description: errorData?.message || 'Failed to check in. Please try again.',
          variant: 'destructive'
        });
      }
    }
  });

  const getLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);
    setRequiresException(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy <= 10) {
      return <Badge variant="default">High Accuracy (GPS)</Badge>;
    } else if (accuracy <= 50) {
      return <Badge variant="secondary">Medium Accuracy</Badge>;
    } else {
      return <Badge variant="destructive">Low Accuracy</Badge>;
    }
  };

  const handleCheckIn = () => {
    if (requiresException && !exceptionReason.trim()) {
      toast({
        title: 'Exception reason required',
        description: 'Please provide a reason for checking in outside the location radius',
        variant: 'destructive'
      });
      return;
    }

    checkInMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <CardTitle>Geolocation Check-In</CardTitle>
        </div>
        <CardDescription>
          Verify your location to check in to {opportunityTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!location && !locationError && (
          <Alert>
            <Navigation className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Location Access Required</p>
              <p className="text-sm">
                To check in, we need to verify you are at the shift location. Click the button below to share your location.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {locationError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">{locationError}</p>
            </AlertDescription>
          </Alert>
        )}

        {location && (
          <Alert variant="default">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-green-600">Location Captured</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latitude:</span> {location.latitude.toFixed(6)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitude:</span> {location.longitude.toFixed(6)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Accuracy:</span> ±{Math.round(location.accuracy)}m{' '}
                    {getAccuracyBadge(location.accuracy)}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {requiresException && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Outside Shift Location</p>
              <p className="text-sm mb-3">
                You are outside the 200m radius of the shift location. Please provide a reason to proceed.
              </p>
              <div className="space-y-2">
                <Label htmlFor="exception-reason">Reason for Exception</Label>
                <Textarea
                  id="exception-reason"
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="e.g., Working from nearby accessible location, coordinating with supervisor..."
                  rows={3}
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!location ? (
            <Button onClick={getLocation} disabled={isGettingLocation} className="w-full">
              {isGettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  Get My Location
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCheckIn}
                disabled={checkInMutation.isLoading || (requiresException && !exceptionReason.trim())}
                className="flex-1"
              >
                {checkInMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Check-In
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={getLocation} disabled={isGettingLocation}>
                Refresh Location
              </Button>
            </>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm font-semibold mb-2">About Location Verification</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You must be within 200m of the shift location</li>
            <li>• Location is only captured during check-in</li>
            <li>• High accuracy GPS is preferred</li>
            <li>• If outside range, provide a reason for approval</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
