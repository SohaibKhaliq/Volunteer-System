import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const VolunteerTeams = () => {
    const navigate = useNavigate();
    const { data: teams, isLoading } = useQuery(['my-teams'], () => api.getMyTeams());

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="h-32 w-full" />
                            <CardContent className="p-6 space-y-4">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const handleOpenChat = (teamId: number) => {
        // In a real app, this would find the chat room ID for the team
        console.log('Opening chat for team:', teamId);
        // For now, we redirect to communications/chat
        navigate('/communications');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Teams</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your role and collaborate with your team members across organizations.
                </p>
            </div>

            {!teams || teams.length === 0 ? (
                <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <CardTitle className="text-xl">No teams yet</CardTitle>
                    <CardDescription className="max-w-xs mx-auto mt-2">
                        You haven't been assigned to any teams. Apply for volunteer opportunities to get started!
                    </CardDescription>
                    <Button variant="outline" className="mt-6" onClick={() => navigate('/volunteer/opportunities')}>
                        Browse Opportunities
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {teams.map((team: any) => (
                        <Card key={team.id} className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-950">
                            <div className="h-2 bg-primary/80" />
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-slate-100 dark:ring-slate-800">
                                            <AvatarImage src={team.organization_logo} />
                                            <AvatarFallback>{team.organization_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-xs font-semibold text-primary uppercase tracking-wider">{team.organization_name}</div>
                                            <CardTitle className="text-xl mt-0.5 group-hover:text-primary transition-colors">{team.name}</CardTitle>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {team.role}
                                    </Badge>
                                </div>
                                <CardDescription className="line-clamp-2 text-slate-600 dark:text-slate-400 leading-relaxed min-h-[3rem]">
                                    {team.description || "No description provided for this team."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                            <Users className="h-4 w-4" />
                                            <span>{team.membersCount} Members</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                            <Calendar className="h-4 w-4" />
                                            <span>Joined {format(new Date(team.joined_at), 'MMM yyyy')}</span>
                                        </div>
                                    </div>

                                    {team.lead && (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-tight">Team Lead</div>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-slate-950">
                                                    <AvatarImage src={team.lead.avatarUrl} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {team.lead.firstName?.[0]}{team.lead.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold">{team.lead.firstName} {team.lead.lastName}</div>
                                                    <div className="text-xs text-muted-foreground">{team.lead.email}</div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-slate-800"
                                                    onClick={() => navigate(`/communications?chatWith=${team.lead.id}`)}
                                                >
                                                    <MessageSquare className="h-4 w-4 text-primary" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 flex gap-3">
                                        <Button
                                            className="flex-1 gap-2 bg-primary hover:bg-primary/90 rounded-xl"
                                            onClick={() => handleOpenChat(team.id)}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Team Chat
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="gap-2 rounded-xl"
                                            onClick={() => navigate(`/organizations/${team.organization_slug}`)}
                                        >
                                            View Org
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VolunteerTeams;
