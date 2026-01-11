import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { ChatRoom } from '../types/chat';
import { ChatWindow } from '../components/Chat/ChatWindow';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
import { Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatPage({ height = "h-[calc(100vh-164px)]" }: { height?: string }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeRoomId = searchParams.get('roomId');

    const { data: user } = useQuery(['currentUser'], () => api.getCurrentUser());
    const { data: chats, isLoading } = useQuery<ChatRoom[]>(['chats'], () => api.listChats());

    const handleSelectChat = (roomId: number) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('roomId', roomId.toString());
            return next;
        });
    };

    // Auto-select room based on orgId if roomId is missing
    useEffect(() => {
        if (!activeRoomId && chats && user) {
            const orgId = searchParams.get('orgId');
            if (orgId) {
                const targetRoom = chats.find(c =>
                    c.organizationId === Number(orgId) && c.volunteerId === user.id
                );
                if (targetRoom) {
                    handleSelectChat(targetRoom.id);
                }
            }
        }
    }, [activeRoomId, chats, user, searchParams]);

    // const selectedChat = chats?.find(c => c.id === Number(activeRoomId));

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    // Premium Empty State
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/10">
            <div className="bg-primary/10 p-6 rounded-full mb-4">
                <MessageSquare className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Select a Conversation</h3>
            <p className="text-muted-foreground max-w-sm">
                Choose an existing chat from the left or start a new coordination for your tasks.
            </p>
        </div>
    );

    return (
        <div className={cn("flex overflow-hidden bg-background rounded-xl border", height)}>
            {/* Chat List Sidebar */}
            <div className={cn(
                "w-full md:w-80 border-r flex flex-col bg-card",
                activeRoomId ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b font-semibold text-lg">Messages</div>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-1 p-2">
                        {chats?.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground text-sm">No active conversations.</div>
                        )}
                        {chats?.map((chat) => {
                            // Determine display name/image
                            const isMeVolunteer = user?.id === chat.volunteerId;
                            const remoteName = isMeVolunteer
                                ? chat.organization?.name
                                : `${chat.volunteer?.firstName} ${chat.volunteer?.lastName}`;
                            const remoteImage = isMeVolunteer
                                ? chat.organization?.logoUrl
                                : chat.volunteer?.profileImageUrl;

                            const lastMessage = chat.messages?.[0];
                            const isActive = Number(activeRoomId) === chat.id;

                            return (
                                <button
                                    key={chat.id}
                                    onClick={() => handleSelectChat(chat.id)}
                                    className={cn(
                                        "flex items-start gap-3 p-3 text-left rounded-lg transition-colors",
                                        isActive ? "bg-accent" : "hover:bg-muted/50"
                                    )}
                                >
                                    <Avatar>
                                        <AvatarImage src={remoteImage} />
                                        <AvatarFallback>{remoteName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-medium truncate">{remoteName}</span>
                                            {lastMessage && (
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">
                                                    {format(new Date(lastMessage.createdAt), 'MMM d')}
                                                </span>
                                            )}
                                        </div>
                                        {chat.resource && (
                                            <div className="text-[10px] text-primary mb-0.5 truncate bg-primary/10 inline-block px-1.5 rounded">
                                                Ref: {chat.resource.name}
                                            </div>
                                        )}
                                        <div className="text-sm text-muted-foreground truncate">
                                            {lastMessage ? (
                                                lastMessage.type === 'system' ? 'System Message' : lastMessage.content
                                            ) : 'No messages'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Window */}
            <div className={cn(
                "flex-1 flex flex-col",
                !activeRoomId ? "hidden md:flex" : "flex"
            )}>
                {Number(activeRoomId) ? (
                    <ChatWindow
                        roomId={Number(activeRoomId)}
                        currentUserId={user?.id}
                        onClose={() => setSearchParams({})}
                    />
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}
