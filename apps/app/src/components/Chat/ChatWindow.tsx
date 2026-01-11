import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { ChatRoom, Message } from '../../types/chat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
    roomId: number;
    currentUserId: number;
    onClose?: () => void;
}

export function ChatWindow({ roomId, currentUserId }: Omit<ChatWindowProps, 'onClose'>) {
    const {
        socket,
        isConnected,
        joinChat,
        leaveChat,
        sendTyping,
        sendStopTyping
    } = useSocket();
    const [typingUsers, setTypingUsers] = useState<number[]>([]);
    const queryClient = useQueryClient();

    // Fetch initial chat data
    const { data: chatRoom, isLoading } = useQuery<ChatRoom>(
        ['chat', roomId],
        () => api.getChat(roomId),
        {
            refetchOnWindowFocus: false,
        }
    );

    // Socket room management and event listeners
    useEffect(() => {
        if (!socket) return;

        joinChat(roomId);

        // Listen for new messages
        const handleMessage = (message: Message) => {
            // Avoid adding message if it's already in the list
            queryClient.setQueryData<ChatRoom>(['chat', roomId], (old) => {
                if (!old) return old;
                if (old.messages.some(m => m.id === message.id)) return old;
                return {
                    ...old,
                    messages: [...old.messages, message],
                };
            });
        };

        const handleTyping = ({ roomId: typingRoomId, userId }: { roomId: number, userId: number }) => {
            if (typingRoomId === roomId && userId !== currentUserId) {
                setTypingUsers(prev => Array.from(new Set([...prev, userId])));
            }
        };

        const handleStopTyping = ({ roomId: typingRoomId, userId }: { roomId: number, userId: number }) => {
            if (typingRoomId === roomId) {
                setTypingUsers(prev => prev.filter(id => id !== userId));
            }
        };

        socket.on('message', handleMessage);
        socket.on('typing', handleTyping);
        socket.on('stop-typing', handleStopTyping);

        return () => {
            socket.off('message', handleMessage);
            socket.off('typing', handleTyping);
            socket.off('stop-typing', handleStopTyping);
            leaveChat(roomId);
        };
    }, [roomId, socket, currentUserId, queryClient]);

    // Send message mutation
    const sendMessageMutation = useMutation(
        (content: string) => api.sendMessage({ roomId, content, type: 'text' }),
        {
            onSuccess: () => {
                // Rely on socket event or invalidate
            },
            onError: () => {
                toast.error('Failed to send message');
            }
        }
    );

    const handleSend = (content: string) => {
        sendMessageMutation.mutate(content);
        sendStopTyping(roomId);
    };

    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<any>();

    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            sendTyping(roomId);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendStopTyping(roomId);
        }, 2000);
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!chatRoom) {
        return <div className="flex h-full items-center justify-center">Chat not found</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between bg-card">
                <div className="font-semibold flex items-center gap-2">
                    {/* Safe Display Name Logic */}
                    {(() => {
                        if (chatRoom.team) {
                            return <span>{chatRoom.team.name}</span>;
                        }
                        if (currentUserId === chatRoom.volunteerId) {
                            return <span>{chatRoom.organization?.name || 'Organization'}</span>;
                        }
                        const first = chatRoom.volunteer?.firstName || '';
                        const last = chatRoom.volunteer?.lastName || '';
                        const name = (first || last) ? `${first} ${last}`.trim() : (chatRoom.volunteer?.email || 'Unknown Volunteer');
                        return <span>{name}</span>;
                    })()}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-yellow-500")} />
                    <span className="text-muted-foreground">{isConnected ? 'Online' : 'Connecting...'}</span>
                </div>
            </div>

            {/* Messages */}
            <MessageList
                messages={chatRoom.messages || []}
                currentUserId={currentUserId}
                className="flex-1"
                onAction={(action, meta) => {
                    console.log('Action', action, meta);
                    // Implement handles for 'accept_return' etc
                }}
            />

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
                <div className="px-4 py-1 text-xs text-muted-foreground">
                    Someone is typing...
                </div>
            )}

            {/* Input */}
            <div onKeyDown={handleTyping}>
                <ChatInput onSend={handleSend} isLoading={sendMessageMutation.isLoading} />
            </div>
        </div>
    );
}
