import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, Search, Edit, Trash2, Users, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/atoms/use-toast';
import api from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function OrganizationTraining() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState<any>(null);

    // Form State
    const [moduleForm, setModuleForm] = useState({
        title: '',
        description: '',
        duration: '',
        difficulty: 'beginner',
        content: '',
        passingScore: '70'
    });

    // Queries
    const { data: modulesData, isLoading: isLoadingModules } = useQuery(
        ['training-modules'],
        () => api.listTrainingModules()
    );

    const modules = useMemo(() => {
        const items = Array.isArray(modulesData) ? modulesData : (modulesData as any)?.data ?? [];
        return items.filter((m: any) =>
            m.title?.toLowerCase().includes(search.toLowerCase()) ||
            m.description?.toLowerCase().includes(search.toLowerCase())
        );
    }, [modulesData, search]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => api.createTrainingModule(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['training-modules']);
            toast({ title: 'Success', description: 'Training module created successfully' });
            setIsCreateModalOpen(false);
            resetForm();
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create training module', variant: 'destructive' })
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.updateTrainingModule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['training-modules']);
            toast({ title: 'Success', description: 'Training module updated successfully' });
            setIsEditModalOpen(false);
            setSelectedModule(null);
            resetForm();
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update training module', variant: 'destructive' })
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.deleteTrainingModule(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['training-modules']);
            toast({ title: 'Success', description: 'Training module deleted successfully' });
            setIsDeleteModalOpen(false);
            setSelectedModule(null);
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete training module', variant: 'destructive' })
    });

    const resetForm = () => {
        setModuleForm({
            title: '',
            description: '',
            duration: '',
            difficulty: 'beginner',
            content: '',
            passingScore: '70'
        });
    };

    const handleCreate = () => {
        if (!moduleForm.title || !moduleForm.description) {
            toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }
        createMutation.mutate(moduleForm);
    };

    const handleEdit = (module: any) => {
        setSelectedModule(module);
        setModuleForm({
            title: module.title || '',
            description: module.description || '',
            duration: module.duration || '',
            difficulty: module.difficulty || 'beginner',
            content: module.content || '',
            passingScore: module.passingScore || '70'
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = () => {
        if (!moduleForm.title || !moduleForm.description) {
            toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }
        updateMutation.mutate({ id: selectedModule.id, data: moduleForm });
    };

    const handleDelete = (module: any) => {
        setSelectedModule(module);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedModule) {
            deleteMutation.mutate(selectedModule.id);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'intermediate':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'advanced':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Training Modules</h1>
                    <p className="text-sm text-gray-500">Create and manage training programs for volunteers</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Module
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
                                <p className="text-xs text-gray-500">Total Modules</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {modules.filter((m: any) => m.status === 'active').length}
                                </p>
                                <p className="text-xs text-gray-500">Active Modules</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                                <p className="text-xs text-gray-500">Enrolled Volunteers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Award className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                                <p className="text-xs text-gray-500">Certificates Issued</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modules Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search training modules..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Module Title</TableHead>
                                <TableHead>Difficulty</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Passing Score</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingModules ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">Loading modules...</TableCell>
                                </TableRow>
                            ) : modules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                        No training modules yet. Create your first module to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                modules.map((module: any) => (
                                    <TableRow key={module.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-gray-900">{module.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{module.description}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(getDifficultyColor(module.difficulty))}>
                                                {module.difficulty || 'Beginner'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Clock className="h-3.5 w-3.5" />
                                                {module.duration || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {module.passingScore || 70}%
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {module.created_at ? format(new Date(module.created_at), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(module)}
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(module)}
                                                    title="Delete"
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

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create Training Module</DialogTitle>
                        <DialogDescription>Design a new training program for your volunteers</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Module Title *</label>
                            <Input
                                placeholder="e.g., First Aid Basics"
                                value={moduleForm.title}
                                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description *</label>
                            <Textarea
                                placeholder="Describe what volunteers will learn..."
                                value={moduleForm.description}
                                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Difficulty Level</label>
                                <Select
                                    value={moduleForm.difficulty}
                                    onValueChange={(val) => setModuleForm({ ...moduleForm, difficulty: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration</label>
                                <Input
                                    placeholder="e.g., 2 hours"
                                    value={moduleForm.duration}
                                    onChange={(e) => setModuleForm({ ...moduleForm, duration: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Passing Score (%)</label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="70"
                                value={moduleForm.passingScore}
                                onChange={(e) => setModuleForm({ ...moduleForm, passingScore: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content</label>
                            <Textarea
                                placeholder="Training content, materials, or links..."
                                value={moduleForm.content}
                                onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={createMutation.isLoading}>
                            {createMutation.isLoading ? 'Creating...' : 'Create Module'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Training Module</DialogTitle>
                        <DialogDescription>Update the training module details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Module Title *</label>
                            <Input
                                placeholder="e.g., First Aid Basics"
                                value={moduleForm.title}
                                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description *</label>
                            <Textarea
                                placeholder="Describe what volunteers will learn..."
                                value={moduleForm.description}
                                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Difficulty Level</label>
                                <Select
                                    value={moduleForm.difficulty}
                                    onValueChange={(val) => setModuleForm({ ...moduleForm, difficulty: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration</label>
                                <Input
                                    placeholder="e.g., 2 hours"
                                    value={moduleForm.duration}
                                    onChange={(e) => setModuleForm({ ...moduleForm, duration: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Passing Score (%)</label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="70"
                                value={moduleForm.passingScore}
                                onChange={(e) => setModuleForm({ ...moduleForm, passingScore: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content</label>
                            <Textarea
                                placeholder="Training content, materials, or links..."
                                value={moduleForm.content}
                                onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsEditModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={updateMutation.isLoading}>
                            {updateMutation.isLoading ? 'Updating...' : 'Update Module'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Training Module</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedModule?.title}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isLoading}>
                            {deleteMutation.isLoading ? 'Deleting...' : 'Delete Module'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
