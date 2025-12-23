
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import { toast } from '@/components/atoms/use-toast';
import { Loader2 } from 'lucide-react';

interface AssignVolunteerModalProps {
  requestId: number | null;
  open: boolean;
  onClose: () => void;
}

export function AssignVolunteerModal({ requestId, open, onClose }: AssignVolunteerModalProps) {
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: volunteers, isLoading: isLoadingVolunteers } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => api.listUsers({ role: 'volunteer' }), // Assuming listUsers supports role filter or returns all users we can filter client side if needed
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: (data: { requestId: number; volunteerId: number }) =>
      api.assignVolunteer(data.requestId, data.volunteerId),
    onSuccess: () => {
      toast({ title: 'Volunteer assigned successfully' });
      queryClient.invalidateQueries(['help-requests']);
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to assign volunteer', variant: 'destructive' });
    }
  });

  const handleAssign = () => {
    if (requestId && selectedVolunteer) {
        assignMutation.mutate({
            requestId,
            volunteerId: parseInt(selectedVolunteer)
        });
    }
  };

  // Filter for potential volunteers if the API returns mixed users
  // Adjust based on actual API response structure
  const volunteerList = Array.isArray(volunteers) ? volunteers : (volunteers as any)?.data || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Volunteer</DialogTitle>
          <DialogDescription>
            Select a volunteer to assign to this request.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoadingVolunteers ? (
            <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
             <Select onValueChange={setSelectedVolunteer} value={selectedVolunteer}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a volunteer" />
                </SelectTrigger>
                <SelectContent>
                    {volunteerList.map((v: any) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                            {v.firstName} {v.lastName} ({v.email})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedVolunteer || assignMutation.isLoading}>
            {assignMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
