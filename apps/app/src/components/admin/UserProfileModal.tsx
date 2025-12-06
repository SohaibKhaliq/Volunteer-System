import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCog, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { User } from '../../types/user';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

/**
 * A sleek, glass‑morphic modal that simply displays the selected
 * user’s information. No editing – just a quick “profile” view.
 */
export default function UserProfileModal({ open, onClose, user }: Props) {
  if (!user) return null;

  const {
    firstName,
    lastName,
    email,
    phone,
    volunteerStatus,
    isActive,
    roles,
    lastLoginAt,
    createdAt
    // updatedAt not displayed — keep object destructuring minimal
  } = user;

  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || email;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <UserCog className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{fullName}</DialogTitle>
              <DialogDescription className="mt-1 text-muted-foreground">Volunteer profile</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{email}</span>
          </div>

          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{phone}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>
            {volunteerStatus && <Badge variant="outline">{volunteerStatus}</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined: {createdAt ? format(new Date(createdAt), 'PPP') : '-'}</span>
          </div>

          {lastLoginAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Last login: {lastLoginAt ? format(new Date(lastLoginAt), 'PPP p') : '-'}</span>
            </div>
          )}

          {roles?.length ? (
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <Badge key={r.id} variant="outline">
                  {r.name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No roles assigned</div>
          )}
        </div>

        <DialogFooter className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
