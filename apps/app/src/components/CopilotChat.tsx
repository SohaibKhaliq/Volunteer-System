import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, X } from "lucide-react"

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: 'Hi! I am your Volunteer Copilot. Ask me anything about shifts or your stats.' }
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    const userMsg = input
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput("")

    // Mock AI Response
    setTimeout(() => {
        let response = "I'm not sure about that."
        if (userMsg.toLowerCase().includes('gold badge')) {
            response = "You are 8 hours away from the Gold Badge! Keep it up!"
        } else if (userMsg.toLowerCase().includes('weekend')) {
            response = "I found 3 outdoor shifts this weekend. Would you like to see them?"
        }
        setMessages(prev => [...prev, { role: 'assistant', text: response }])
    }, 1000)
  }

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-xl flex flex-col z-50">
      <CardHeader className="py-3 px-4 border-b flex flex-row justify-between items-center bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-bold">Copilot</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary/80" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
                <div key={i} className={\`max-w-[80%] p-2 rounded-lg text-sm \${
                    m.role === 'user'
                    ? 'bg-primary text-primary-foreground self-end'
                    : 'bg-muted self-start'
                }\`}>
                    {m.text}
                </div>
            ))}
        </div>
      </ScrollArea>
      <div className="p-3 border-t flex gap-2">
        <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Copilot..."
            onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <Button size="icon" onClick={handleSend}><Send className="h-4 w-4" /></Button>
      </div>
    </Card>
  )
}
