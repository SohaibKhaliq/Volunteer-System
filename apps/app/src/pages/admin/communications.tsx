// src/pages/admin/communications.tsx
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CalendarClock } from "lucide-react";

// Mock data for demonstration
const mockRecipients = [
  { id: 1, name: "All Volunteers" },
  { id: 2, name: "Event Organizers" },
  { id: 3, name: "Admins" },
];

const mockScheduled = [
  { id: 1, subject: "Weekly Update", sendAt: "2025-11-20 09:00" },
  { id: 2, subject: "Event Reminder", sendAt: "2025-11-22 14:30" },
];

const mockHistory = [
  { id: 1, subject: "Welcome Email", sentAt: "2025-11-10 08:12", status: "Sent" },
  { id: 2, subject: "Policy Change", sentAt: "2025-11-12 15:45", status: "Sent" },
  { id: 3, subject: "Survey Invitation", sentAt: "2025-11-15 11:20", status: "Failed" },
];

export default function AdminCommunications() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipient, setRecipient] = useState<string>("");

  const handleSend = () => {
    // In a real app this would call an API – here we just log to console
    console.log("Sending message", { subject, body, recipient });
    alert("Message queued (mock)");
    setSubject("");
    setBody("");
    setRecipient("");
  };

  return (
    <div className="space-y-6">
      {/* Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Select onValueChange={setRecipient} value={recipient}>
            <SelectTrigger>
              <SelectValue placeholder="Select Recipients" />
            </SelectTrigger>
            <SelectContent>
              {mockRecipients.map((r) => (
                <SelectItem key={r.id} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Message body…"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={!subject || !body || !recipient}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Scheduled Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Send At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockScheduled.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell>{msg.subject}</TableCell>
                  <TableCell>{msg.sendAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Send History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.subject}</TableCell>
                  <TableCell>{h.sentAt}</TableCell>
                  <TableCell>
                    <Badge variant={h.status === "Sent" ? "default" : "destructive"}>
                      {h.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
