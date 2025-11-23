import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Role {
  id: number;
  name: string;
}

interface UserRef {
  id: number;
  firstName?: string;
  lastName?: string;
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
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-full max-w-md">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Manage Roles — {user.firstName || ''} {user.lastName || ''}
          </h3>
          <button className="text-muted-foreground" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {roles.length === 0 ? (
            <div className="text-sm text-muted-foreground">No roles available</div>
          ) : (
            roles.map((role) => {
              const checked = selectedRoleIds.has(role.id);
              return (
                <label key={role.id} className="flex items-center justify-between gap-3 p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleRole(role.id)}
                      className="h-4 w-4"
                    />
                    <span className="font-medium">{role.name}</span>
                  </div>
                  {checked ? (
                    <Badge className="bg-green-500">Assigned</Badge>
                  ) : (
                    <Badge variant="outline">Not assigned</Badge>
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
