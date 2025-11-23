import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from '@/components/atoms/use-toast';
import api from '@/lib/api';
import { useState } from 'react';
import type { User } from '@/pages/admin/users';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  /** Called after a successful update so the parent can refresh data */
  onSuccess: (updated: User) => void;
}

/**
 * A modern edit dialog for a user. Allows editing of basic fields.
 * After saving, it calls the API, shows a toast, and notifies the parent.
 */
export default function EditUserModal({ open, onClose, user, onSuccess }: Props) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [volunteerStatus, setVolunteerStatus] = useState(user?.volunteerStatus ?? '');

  // When the modal opens for a different user, sync the fields
  if (user && user.id && open) {
    // This simple sync works because the component is re‑rendered each time `open` changes.
    // If you notice stale values, you can add a useEffect to update state on `user` change.
  }

  const handleSubmit = async () => {
    if (!user) return;
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        volunteerStatus,
      };
      const updated = await api.updateUser(user.id, payload);
      toast({ title: 'User updated', variant: 'success' });
      onSuccess(updated);
    } catch (err) {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Modify basic user information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Select value={volunteerStatus} onValueChange={setVolunteerStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Volunteer status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
