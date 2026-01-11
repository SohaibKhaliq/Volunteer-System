import React, { useEffect, useRef } from 'react';
import { Message } from '../../types/chat';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface MessageListProps {
    messages: Message[];
    currentUserId: number;
    className?: string;
    onAction?: (action: string, metadata: any) => void;
}

export function MessageList({ messages, currentUserId, className, onAction }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className={cn('flex flex-col h-full', className)}>
            <ScrollArea className="flex-1 pr-4">
                <div className="flex flex-col gap-4 py-4">
                    {messages.map((message) => {
                        const isMe = message.senderId === currentUserId;
                        const isSystem = message.type === 'system';
                        const isReturnRequest = message.type === 'return_request';

                        if (isSystem) {
                            return (
                                <div key={message.id} className="flex justify-center my-4">
                                    <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1 rounded-full border">
                                        {message.content}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={message.id}
                                className={cn('flex gap-3 max-w-[80%]', isMe ? 'ml-auto flex-row-reverse' : '')}
                            >
                                <Avatar className="w-8 h-8 mt-1">
                                    <AvatarImage src={message.sender?.profileImageUrl} />
                                    <AvatarFallback>{message.sender?.firstName?.[0]}</AvatarFallback>
                                </Avatar>

                                <div className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {message.sender?.firstName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/70">
                                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {isReturnRequest ? (
                                        <div className="bg-card border rounded-lg p-4 shadow-sm w-full space-y-3">
                                            <div className="font-semibold text-sm">Return Request</div>
                                            <p className="text-sm text-card-foreground">{message.content}</p>
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => onAction?.('accept_return', message.metadata)}
                                                >
                                                    Accept Return
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    Detailed Check
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={cn(
                                                'rounded-2xl px-4 py-2 text-sm shadow-sm',
                                                isMe
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-muted/80 text-foreground rounded-tl-none'
                                            )}
                                        >
                                            {message.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
        </div>
    );
}
