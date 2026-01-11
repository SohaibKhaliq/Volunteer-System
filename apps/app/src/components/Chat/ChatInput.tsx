import React, { useState, KeyboardEvent } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea'; // Assuming textarea exists, checking ui list later. If not using input.tsx
import { Input } from '../ui/input';
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
    onSend: (content: string) => void;
    isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [value, setValue] = useState('');

    const handleSend = () => {
        if (!value.trim() || isLoading) return;
        onSend(value);
        setValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-center gap-2 p-3 border-t bg-background">
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-muted/50 border-transparent focus:border-border transition-all"
                disabled={isLoading}
            />
            <Button
                onClick={handleSend}
                disabled={!value.trim() || isLoading}
                size="icon"
                className="rounded-full w-10 h-10 shrink-0"
            >
                <SendHorizontal className="w-5 h-5" />
            </Button>
        </div>
    );
}
