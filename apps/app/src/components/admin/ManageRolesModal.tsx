import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { UserCog, Shield, CheckCircle2, Circle } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface UserRef {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserRef | null;
  roles: Role[];
  selectedRoleIds: Set<number>;
  onToggleRole: (roleId: number) => void;
}

export default function ManageRolesModal({ open, onClose, user, roles, selectedRoleIds, onToggleRole }: Props) {
  if (!user) return null;

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'User';

  const assignedCount = selectedRoleIds.size;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <UserCog className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">Manage User Roles</DialogTitle>
              <DialogDescription className="mt-1">{userName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {assignedCount} {assignedCount === 1 ? 'role' : 'roles'} assigned
              </span>
            </div>
            <div className="flex-1" />
            <Badge variant="outline" className="text-xs">
              {roles.length} total
            </Badge>
          </div>

          {/* Roles List */}
          <div className="h-[300px] overflow-y-auto pr-4">
            {roles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No roles available</p>
                <p className="text-xs text-muted-foreground mt-1">Create roles first to assign them to users</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => {
                  const isAssigned = selectedRoleIds.has(role.id);
                  return (
                    <button
                      key={role.id}
                      onClick={() => onToggleRole(role.id)}
                      className={`
                        w-full flex items-center justify-between gap-3 p-4 
                        border-2 rounded-lg transition-all
                        hover:shadow-md hover:scale-[1.02]
                        ${
                          isAssigned
                            ? 'border-violet-500 bg-violet-50 hover:bg-violet-100'
                            : 'border-gray-200 bg-white hover:border-violet-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="relative">
                          {isAssigned ? (
                            <CheckCircle2 className="h-6 w-6 text-violet-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm capitalize">{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">{role.description}</div>
                          )}
                        </div>
                      </div>
                      {isAssigned ? (
                        <Badge className="bg-violet-600 hover:bg-violet-700 text-white border-0">Assigned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Not assigned
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Click on a role to toggle assignment</div>
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
