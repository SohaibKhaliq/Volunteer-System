import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function OrganizationResourceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isReconcileOpen, setIsReconcileOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

    const { data: resource, isLoading } = useQuery({
        queryKey: ['resource', id],
        queryFn: () => api.getResource(id!),
        enabled: !!id
    });

    const { data: volunteers } = useQuery({
        queryKey: ['org-volunteers'],
        queryFn: () => api.listOrganizationVolunteers(resource?.organization_id),
        enabled: !!resource?.organization_id
    });

    const assignMutation = useMutation({
        mutationFn: (data: any) => api.distributeResource(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resource', id] });
            setIsAssignOpen(false);
        }
    });

    const reconcileMutation = useMutation({
        mutationFn: (data: any) => api.reconcileReturn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resource', id] });
            setIsReconcileOpen(false);
            setSelectedAssignment(null);
        }
    });

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        assignMutation.mutate({
            resourceId: Number(id),
            volunteerId: Number(formData.get('volunteerId')),
            quantity: 1, // Default to 1 for now
            notes: formData.get('notes'),
            expectedReturnAt: formData.get('expectedReturnAt')
        });
    };

    const handleReconcile = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        reconcileMutation.mutate({
            assignmentId: selectedAssignment.id,
            condition: formData.get('condition'),
            notes: formData.get('notes')
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!resource) return <div>Resource not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/organization/resources')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{resource.name}</h1>
                    <p className="text-muted-foreground">{resource.category}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={resource.quantityAvailable < 1}>Assign to Volunteer</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Assign Resource</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAssign} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Volunteer</Label>
                                    <Select name="volunteerId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select volunteer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {volunteers?.data?.map((v: any) => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.first_name} {v.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Expected Return Date</Label>
                                    <Input type="date" name="expectedReturnAt" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea name="notes" placeholder="Optional notes..." />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={assignMutation.isPending}>
                                        {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Inventory Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Quantity</span>
                            <span className="font-bold">{resource.quantityTotal ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Available</span>
                            <span className="font-bold text-green-600">{resource.quantityAvailable ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge>{resource.status}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Assignment History</CardTitle>
                        <CardDescription>Track who has this item</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Volunteer</TableHead>
                                    <TableHead>Assigned Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resource.assignments?.map((assignment: any) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell>
                                            {assignment.volunteer ? `${assignment.volunteer.first_name} ${assignment.volunteer.last_name}` : 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            {assignment.assignedAt ? format(new Date(assignment.assignedAt), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                assignment.status === 'IN_USE' ? 'default' :
                                                    assignment.status === 'PENDING_RETURN' ? 'destructive' : 'secondary'
                                            }>
                                                {assignment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {(assignment.status === 'IN_USE' || assignment.status === 'PENDING_RETURN') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedAssignment(assignment);
                                                        setIsReconcileOpen(true);
                                                    }}
                                                >
                                                    <RefreshCcw className="h-3 w-3 mr-1" /> Reconcile
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!resource.assignments?.length && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">No assignments found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reconcile Return</DialogTitle>
                        <DialogDescription>
                            Confirm the return of this item.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReconcile} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Condition</Label>
                            <Select name="condition" defaultValue="good" required>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="good">Good</SelectItem>
                                    <SelectItem value="damaged">Damaged</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea name="notes" placeholder="Condition notes..." />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={reconcileMutation.isPending}>
                                {reconcileMutation.isPending ? 'Processing...' : 'Confirm Return'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
