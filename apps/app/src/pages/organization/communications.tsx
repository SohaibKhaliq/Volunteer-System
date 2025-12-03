import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, MoreVertical, Phone, Video, Paperclip, Image as ImageIcon, Smile } from 'lucide-react';

export default function OrganizationCommunications() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');

  const chats = [
    {
      id: 1,
      name: 'Sarah Ahmed',
      avatar: 'https://github.com/shadcn.png',
      lastMessage: 'I can help with the beach cleanup this weekend.',
      time: '10:30 AM',
      unread: 2,
      status: 'online'
    },
    {
      id: 2,
      name: 'Mohammed Ali',
      avatar: '',
      lastMessage: 'Thanks for the update!',
      time: 'Yesterday',
      unread: 0,
      status: 'offline'
    },
    {
      id: 3,
      name: 'Volunteers Group',
      avatar: '',
      lastMessage: 'Layla: Is the location confirmed?',
      time: 'Yesterday',
      unread: 5,
      status: 'group'
    }
  ];

  const messages = [
    {
      id: 1,
      senderId: 2, // Them
      text: 'Hi, I saw the new event posted.',
      time: '10:00 AM'
    },
    {
      id: 2,
      senderId: 1, // Me
      text: 'Hello Sarah! Yes, the Beach Cleanup is scheduled for Saturday.',
      time: '10:05 AM'
    },
    {
      id: 3,
      senderId: 2, // Them
      text: 'Great! I can help with the beach cleanup this weekend. Do I need to bring anything?',
      time: '10:30 AM'
    }
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Communications</h2>
        <p className="text-muted-foreground">Chat with volunteers and team members.</p>
      </div>

      <Card className="flex-1 flex overflow-hidden border-0 shadow-sm ring-1 ring-gray-200">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50/50 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-8 bg-white" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-gray-100/50 ${
                    selectedChat === chat.id
                      ? 'bg-white border-l-4 border-blue-600 shadow-sm'
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>{chat.name[0]}</AvatarFallback>
                    </Avatar>
                    {chat.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm truncate">{chat.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{chat.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <Badge
                      variant="default"
                      className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                    >
                      {chat.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={chats.find((c) => c.id === selectedChat)?.avatar} />
                <AvatarFallback>{chats.find((c) => c.id === selectedChat)?.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{chats.find((c) => c.id === selectedChat)?.name}</h3>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === 1 ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.senderId === 1
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1 text-right ${msg.senderId === 1 ? 'text-blue-100' : 'text-gray-500'}`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-gray-50/30">
            <div className="flex items-end gap-2">
              <div className="flex gap-1 pb-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Type a message..."
                  className="min-h-[40px] max-h-[120px] resize-none pr-10"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <Button variant="ghost" size="icon" className="absolute right-2 bottom-1.5 h-6 w-6">
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <Button className="h-10 w-10 p-0 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
