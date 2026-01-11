import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useApp } from '@/providers/app-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Users, Package, ShieldCheck, Plus, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatWindow } from '@/components/Chat/ChatWindow';

export default function OrganizationTeamDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useApp();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('members');

    // Dialog states
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isAssignResourceOpen, setIsAssignResourceOpen] = useState(false);
    const [isAddRequirementOpen, setIsAddRequirementOpen] = useState(false);

    // Forms
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [selectedResource, setSelectedResource] = useState('');
    const [resourceQuantity, setResourceQuantity] = useState('1');
    const [selectedTemplate, setSelectedTemplate] = useState('');

    const teamId = parseInt(id || '0');

    // Queries
    const { data: team, isLoading: isTeamLoading } = useQuery({
        queryKey: ['team', teamId],
        queryFn: () => api.getOrganizationTeam(teamId),
        enabled: !!teamId
    });

    const { data: members, isLoading: isMembersLoading } = useQuery({
        queryKey: ['team-members', teamId],
        queryFn: () => api.getTeamMembers(teamId),
        enabled: !!teamId
    });

    const { data: resources, isLoading: isResourcesLoading } = useQuery({
        queryKey: ['team-resources', teamId],
        queryFn: () => api.getTeamResources(teamId),
        enabled: !!teamId
    });

    const { data: requirements, isLoading: isRequirementsLoading } = useQuery({
        queryKey: ['team-requirements', teamId],
        queryFn: () => api.getTeamRequirements(teamId),
        enabled: !!teamId
    });

    // Helper Queries for forms
    const { data: orgVolunteers } = useQuery({
        queryKey: ['organizationVolunteers'],
        queryFn: () => api.listOrganizationVolunteers({ perPage: 100 }),
        enabled: !!team
    });

    const { data: orgResources } = useQuery({
        queryKey: ['organizationResources'],
        queryFn: () => api.listMyOrganizationResources(),
        enabled: !!team
    });

    // Mutations
    const addMemberMutation = useMutation({
        mutationFn: (userId: number) => api.addTeamMember(teamId, { user_id: userId }),
        onSuccess: () => {
            toast.success('Member added successfully');
            setIsAddMemberOpen(false);
            queryClient.invalidateQueries(['team-members', teamId]);
        },
        onError: (err: any) => {
            if (err.response?.data?.missing_requirements) {
                toast.error(`Volunteer missing requirements: ${err.response.data.missing_requirements.join(', ')}`);
            } else {
                toast.error(err.response?.data?.message || 'Failed to add member');
            }
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId: number) => api.removeTeamMember(teamId, userId),
        onSuccess: () => {
            toast.success('Member removed');
            queryClient.invalidateQueries(['team-members', teamId]);
        }
    });

    const assignResourceMutation = useMutation({
        mutationFn: (data: any) => api.assignTeamResource(teamId, data),
        onSuccess: () => {
            toast.success('Resource assigned');
            setIsAssignResourceOpen(false);
            queryClient.invalidateQueries(['team-resources', teamId]);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to assign resource')
    });

    const addRequirementMutation = useMutation({
        mutationFn: (templateId: number) => api.addTeamRequirement(teamId, { template_id: templateId }),
        onSuccess: () => {
            toast.success('Requirement added');
            setIsAddRequirementOpen(false);
            queryClient.invalidateQueries(['team-requirements', teamId]);
        }
    });

    const deleteRequirementMutation = useMutation({
        mutationFn: (reqId: number) => api.deleteTeamRequirement(teamId, reqId),
        onSuccess: () => {
            queryClient.invalidateQueries(['team-requirements', teamId]);
        }
    });

    if (isTeamLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!team) return <div className="p-8">Team not found</div>;

    const chatRoomId = team.chatRooms?.[0]?.id;

    return (
        <div className="container mx-auto p-6 space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex-none space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/organization/teams')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Teams
                    </Button>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{team.name}</h1>
                        <p className="text-muted-foreground mt-1">{team.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant={team.minRequirementsEnabled ? 'default' : 'secondary'}>
                            {team.minRequirementsEnabled ? 'Strict Certs' : 'Open Entry'}
                        </Badge>
                        <Badge variant="outline">Capacity: {team.capacity || 'Unlimited'}</Badge>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full justify-start border-b rounded-none px-0 bg-transparent h-auto p-0 mb-4">
                    <TabsTrigger value="members" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Members</TabsTrigger>
                    <TabsTrigger value="resources" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Resources</TabsTrigger>
                    <TabsTrigger value="requirements" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Requirements</TabsTrigger>
                    <TabsTrigger value="chat" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Team Chat</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <TabsContent value="members" className="space-y-4 m-0 h-full">
                        <div className="flex justify-between">
                            <h3 className="text-lg font-medium">Team Members</h3>
                            <Button onClick={() => setIsAddMemberOpen(true)} size="sm"><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {members?.map((member: any) => (
                                        <div key={member.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{member.user?.firstName} {member.user?.lastName}</p>
                                                <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeMemberMutation.mutate(member.userId)}
                                                className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {members?.length === 0 && <div className="p-8 text-center text-muted-foreground">No members yet.</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="resources" className="space-y-4 m-0 h-full">
                        <div className="flex justify-between">
                            <h3 className="text-lg font-medium">Assigned Resources</h3>
                            <Button onClick={() => setIsAssignResourceOpen(true)} size="sm"><Plus className="h-4 w-4 mr-2" /> Assign Resource</Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {resources?.map((assignment: any) => (
                                        <div key={assignment.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{assignment.resource?.name} (x{assignment.quantity})</p>
                                                <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                                            </div>
                                            <Badge>{assignment.status}</Badge>
                                        </div>
                                    ))}
                                    {resources?.length === 0 && <div className="p-8 text-center text-muted-foreground">No resources assigned.</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="requirements" className="space-y-4 m-0 h-full">
                        <div className="flex justify-between">
                            <h3 className="text-lg font-medium">Certification Requirements</h3>
                            <Button onClick={() => setIsAddRequirementOpen(true)} size="sm"><Plus className="h-4 w-4 mr-2" /> Add Requirement</Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {requirements?.map((req: any) => (
                                        <div key={req.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{req.template?.name || `Template #${req.templateId}`}</p>
                                                <p className="text-sm text-muted-foreground">Mandatory for all members</p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => deleteRequirementMutation.mutate(req.id)} className="text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {requirements?.length === 0 && <div className="p-8 text-center text-muted-foreground">No requirements set.</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="chat" className="m-0 h-full">
                        {chatRoomId ? (
                            <Card className="h-full border-none shadow-none">
                                <ChatWindow roomId={chatRoomId} currentUserId={user?.id} />
                            </Card>
                        ) : (
                            <Card className="h-full flex flex-col justify-center items-center text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mb-4" />
                                <p>No chat room available for this team.</p>
                            </Card>
                        )}
                    </TabsContent>
                </div>
            </Tabs>

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Volunteer</Label>
                        <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select volunteer..." />
                            </SelectTrigger>
                            <SelectContent>
                                {orgVolunteers?.data?.map((vol: any) => (
                                    <SelectItem key={vol.id} value={vol.userId?.toString() || vol.id.toString()}>
                                        {vol.user?.firstName} {vol.user?.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => addMemberMutation.mutate(parseInt(selectedVolunteer))} disabled={!selectedVolunteer || addMemberMutation.isPending}>
                            {addMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Resource Dialog */}
            <Dialog open={isAssignResourceOpen} onOpenChange={setIsAssignResourceOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign Resource</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label>Resource</Label>
                            <Select value={selectedResource} onValueChange={setSelectedResource}>
                                <SelectTrigger><SelectValue placeholder="Select resource..." /></SelectTrigger>
                                <SelectContent>
                                    {orgResources?.map((res: any) => (
                                        <SelectItem key={res.id} value={res.id.toString()}>
                                            {res.name} (Available: {res.quantityAvailable})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Quantity</Label>
                            <Input type="number" value={resourceQuantity} onChange={e => setResourceQuantity(e.target.value)} min="1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => assignResourceMutation.mutate({ resource_id: parseInt(selectedResource), quantity: parseInt(resourceQuantity) })}
                            disabled={!selectedResource}>
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Requirement Dialog */}
            <Dialog open={isAddRequirementOpen} onOpenChange={setIsAddRequirementOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Certification Requirement</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <Label>Certificate Template</Label>
                        <Input placeholder="Template ID (Temporary)" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => addRequirementMutation.mutate(parseInt(selectedTemplate))}
                            disabled={!selectedTemplate}>
                            Add Requirement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
