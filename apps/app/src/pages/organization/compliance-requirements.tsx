import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, Plus, MoreHorizontal, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type ComplianceRequirement = {
  id: number;
  name: string;
  docType: string;
  description?: string;
  isMandatory: boolean;
  enforcementLevel: 'onboarding' | 'signup' | 'checkin';
  createdAt: string;
};

export default function OrganizationComplianceRequirements() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<ComplianceRequirement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    docType: '',
    description: '',
    isMandatory: true,
    enforcementLevel: 'onboarding'
  });

  // Fetch Requirements
  const { data: requirements, isLoading } = useQuery({
    queryKey: ['organizationComplianceRequirements'],
    queryFn: async () => {
      const res = await api.getComplianceRequirements();
      return res.data;
    }
  });

  // Create/Update Mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingReq) {
        return api.updateComplianceRequirement(editingReq.id, data);
      }
      return api.createComplianceRequirement(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationComplianceRequirements'] });
      setIsDialogOpen(false);
      toast.success(editingReq ? 'Requirement updated' : 'Requirement created');
    },
    onError: () => {
      toast.error('Failed to save requirement');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteComplianceRequirement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationComplianceRequirements'] });
      toast.success('Requirement deleted');
    },
    onError: () => {
      toast.error('Failed to delete requirement');
    }
  });

  const handleOpenCreate = () => {
    setEditingReq(null);
    setFormData({
      name: '',
      docType: '',
      description: '',
      isMandatory: true,
      enforcementLevel: 'onboarding'
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (req: ComplianceRequirement) => {
    setEditingReq(req);
    setFormData({
      name: req.name,
      docType: req.docType,
      description: req.description || '',
      isMandatory: Boolean(req.isMandatory),
      enforcementLevel: req.enforcementLevel || 'onboarding'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.docType) {
      toast.error('Name and Document Type are required');
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const reqList = Array.isArray(requirements) ? requirements : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/organization/compliance">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Requirements</h2>
           </div>
          <p className="text-muted-foreground ml-11">Define rules for volunteer compliance.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingReq ? 'Edit Requirement' : 'New Requirement'}</DialogTitle>
              <DialogDescription>
                Set rules for mandatory documents and when they are enforced.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="req-name">Name</Label>
                <Input
                  id="req-name"
                  placeholder="e.g. Working With Children Check"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="doc-type">Document Type Key</Label>
                <Input
                  id="doc-type"
                  placeholder="e.g. WWCC"
                  value={formData.docType}
                  onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">This must match the 'Type' used in document uploads.</p>
              </div>

               <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Instructions for volunteers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Enforcement Level</Label>
                   <Select 
                    value={formData.enforcementLevel} 
                    onValueChange={(val) => setFormData({...formData, enforcementLevel: val as any})}
                   >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding (Join Org)</SelectItem>
                      <SelectItem value="signup">Sign Up (Apply)</SelectItem>
                      <SelectItem value="checkin">Check In (Shift)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2 flex flex-col justify-center">
                  <div className="flex items-center space-x-2">
                    <Switch 
                        id="mandatory-mode" 
                        checked={formData.isMandatory}
                        onCheckedChange={(checked) => setFormData({...formData, isMandatory: checked})}
                    />
                    <Label htmlFor="mandatory-mode">Mandatory</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">If off, it's just a recommendation.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saveMutation.isLoading}>
                {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingReq ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Defined Requirements</CardTitle>
          <CardDescription>
            These requirements block actions if the volunteer does not have a valid matching document.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Document Key</TableHead>
                <TableHead>Enforced At</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reqList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No requirements defined. Volunteers can perform all actions unrestricted.
                  </TableCell>
                </TableRow>
              ) : (
                reqList.map((req: ComplianceRequirement) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <div>
                            <div>{req.name}</div>
                            {req.description && <div className="text-xs text-muted-foreground font-normal">{req.description}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{req.docType}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{req.enforcementLevel}</TableCell>
                    <TableCell>
                      {req.isMandatory ? (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Required</Badge>
                      ) : (
                        <Badge variant="secondary">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(req)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this requirement?')) {
                              deleteMutation.mutate(req.id);
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
    </div>
  );
}
