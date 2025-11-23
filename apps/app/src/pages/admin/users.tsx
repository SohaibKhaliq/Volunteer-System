import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import {
  MoreVertical,
  UserPlus,
  Search,
  Filter,
  Download,
  Mail,
  Ban,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  UserCog
} from 'lucide-react';

import { toast } from '@/components/atoms/use-toast';
import ManageRolesModal from '@/components/admin/ManageRolesModal';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  volunteerStatus: string;
  isActive: boolean;
  roles?: { name: string; id: number }[];
  lastLoginAt?: string;
  participationCount?: number;
  complianceStatus?: 'compliant' | 'pending' | 'expired';
}

export default function AdminUsers() {
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset pagination when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, perPage]);

  // Users Query (React Query v4 Syntax)
  const { data: usersRes, isLoading } = useQuery(
    ['users', debouncedSearch, statusFilter, page, perPage],
    () => api.listUsersPaged(debouncedSearch, page, perPage, statusFilter === 'all' ? undefined : statusFilter),
    { keepPreviousData: true }
  );

  const users = usersRes?.data || [];
  // map backend fields to UI-friendly fields
  const mappedUsers: User[] = (users || []).map((u: any) => ({
    ...u,
    // prefer explicit email_verified_at when available
    isActive:
      u.email_verified_at !== undefined
        ? u.email_verified_at !== null
        : u.is_disabled === undefined
          ? true
          : !u.is_disabled,
    roles: u.roles || []
  }));
  const usersMeta = usersRes?.meta || {};

  // Analytics Query
  const { data: analytics } = useQuery(['userAnalytics'], api.getUserAnalytics);

  // Mutations
  const deactivateMutation = useMutation((userId: number) => api.updateUser(userId, { isDisabled: true }), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast({ title: 'User deactivated', variant: 'success' });
    }
  });

  const activateMutation = useMutation((userId: number) => api.activateUser(userId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast({ title: 'User activated', variant: 'success' });
    }
  });

  const deleteMutation = useMutation((userId: number) => api.deleteUser(userId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast({ title: 'User deleted', variant: 'success' });
    }
  });

  const sendReminderMutation = useMutation((userId: number) => api.sendReengagementEmail(userId), {
    onSuccess: () => {
      toast({ title: 'Reminder sent', variant: 'success' });
    }
  });

  // New mutations for role & activation endpoints
  const addRoleMutation = useMutation(
    ({ userId, roleId }: { userId: number; roleId: number }) => api.addUserRole(userId, roleId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast({ title: 'Role assigned', variant: 'success' });
      }
    }
  );

  const removeRoleMutation = useMutation(
    ({ userId, roleId }: { userId: number; roleId: number }) => api.removeUserRole(userId, roleId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast({ title: 'Role removed', variant: 'success' });
      }
    }
  );

  const activateUserMutation = useMutation((userId: number) => api.activateUser(userId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast({ title: 'User activated', variant: 'success' });
    }
  });

  // Roles modal state
  const [rolesModalUser, setRolesModalUser] = useState<User | null>(null);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [userRoleIds, setUserRoleIds] = useState<Set<number>>(new Set());

  const openRolesModal = async (user: User) => {
    setRolesModalUser(user);
    // fetch available roles
    try {
      const res = await api.list('roles');
      const list = Array.isArray(res) ? res : (res as any).data || [];
      setAvailableRoles(list as any[]);
      const ids = new Set<number>((user.roles || []).map((r) => r.id));
      setUserRoleIds(ids);
    } catch (err) {
      toast({ title: 'Failed to load roles', variant: 'destructive' });
    }
  };

  const toggleUserRole = (roleId: number) => {
    if (!rolesModalUser) return;
    const userId = rolesModalUser.id;
    if (userRoleIds.has(roleId)) {
      removeRoleMutation.mutate({ userId, roleId });
      const next = new Set(userRoleIds);
      next.delete(roleId);
      setUserRoleIds(next);
    } else {
      addRoleMutation.mutate({ userId, roleId });
      const next = new Set(userRoleIds);
      next.add(roleId);
      setUserRoleIds(next);
    }
  };

  // UI Helpers
  const getComplianceBadge = (status?: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500">Compliant</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-500">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage volunteers, organizations, and their roles</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new volunteer or organization</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <Input placeholder="Email" />
                <Input placeholder="First Name" />
                <Input placeholder="Last Name" />
                <Input placeholder="Phone" />
              </div>

              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Status: {statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>Inactive</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="text-2xl font-bold">{analytics?.total ?? usersMeta.total}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-green-600">{analytics?.active}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-muted-foreground">Inactive</div>
          <div className="text-2xl font-bold text-gray-600">{analytics?.inactive}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-muted-foreground">Compliance Issues</div>
          <div className="text-2xl font-bold text-red-600">{analytics?.byRole?.length ?? 0}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Participation</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {mappedUsers.length > 0 ? (
              mappedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>

                  <TableCell>{user.email}</TableCell>

                  <TableCell>
                    {user.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.length
                        ? user.roles.map((role) => (
                            <Badge key={role.id} variant="outline">
                              {role.name}
                            </Badge>
                          ))
                        : 'No roles'}
                    </div>
                  </TableCell>

                  <TableCell>{user.participationCount || 0} events</TableCell>

                  <TableCell>{getComplianceBadge(user.complianceStatus)}</TableCell>

                  <TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <UserCog className="h-4 w-4 mr-2" />
                          <button onClick={() => openRolesModal(user)} className="w-full text-left">
                            Manage Roles
                          </button>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => sendReminderMutation.mutate(user.id)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Reminder
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {user.isActive ? (
                          <DropdownMenuItem
                            className="text-orange-600"
                            onClick={() => deactivateMutation.mutate(user.id)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600" onClick={() => activateMutation.mutate(user.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('Delete this user?')) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <ManageRolesModal
        open={!!rolesModalUser}
        onClose={() => setRolesModalUser(null)}
        user={rolesModalUser}
        roles={availableRoles}
        selectedRoleIds={userRoleIds}
        onToggleRole={toggleUserRole}
      />
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <div className="text-sm text-muted-foreground">
          Page {usersMeta.current_page || page} of {usersMeta.last_page || '-'}
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={(usersMeta.current_page || page) <= 1}
          >
            Prev
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={usersMeta.current_page >= usersMeta.last_page}
          >
            Next
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm">Page</span>

            <Input
              type="number"
              className="w-20"
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value)))}
            />

            <span className="text-sm">of {usersMeta.last_page || '-'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Per page</span>

            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
