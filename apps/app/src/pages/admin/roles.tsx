import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/atoms/use-toast';
import { Trash2, Edit, Plus, Shield } from 'lucide-react';

export default function AdminRoles() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: number[];
  }>({ name: '', description: '', permissions: [] });

  const { data: roles = [], isLoading } = useQuery(['roles'], () =>
    api.listRoles().then((res: any) => (Array.isArray(res) ? res : res.data || []))
  );

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery(['permissions'], () =>
    api.listPermissions().then((res: any) => (Array.isArray(res) ? res : res.data || []))
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast({ title: 'Role created successfully', variant: 'success' });
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: 'Failed to create role', variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast({ title: 'Role updated successfully', variant: 'success' });
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: 'Failed to update role', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast({ title: 'Role deleted successfully', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to delete role', variant: 'destructive' })
  });

  const handleSubmit = () => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setIsDialogOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map((p: any) => p.id) || []
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Roles Management
        </h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No roles found.
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role: any) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this role?')) {
                              deleteMutation.mutate(role.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Moderator"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Role description..."
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-md p-4 h-60 overflow-y-auto space-y-2">
                {isLoadingPermissions ? (
                  <p className="text-sm text-muted-foreground">Loading permissions...</p>
                ) : (
                  permissions.map((perm: any) => (
                    <div key={perm.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={`perm-${perm.id}`}
                        className="mt-1"
                        checked={(formData.permissions || []).includes(perm.id)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const current = formData.permissions || []
                          if (checked) {
                            setFormData({ ...formData, permissions: [...current, perm.id] })
                          } else {
                            setFormData({
                              ...formData,
                              permissions: current.filter((id) => id !== perm.id)
                            })
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={`perm-${perm.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {perm.name}
                        </label>
                        {perm.description && (
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isLoading || updateMutation.isLoading}>
              {editingRole ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
