// src/pages/admin/communications.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, CalendarClock, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { commTemplates as templates, commScheduled, commHistory } from '@/lib/mock/adminMock';

// Mock data for demonstration
const mockRecipients = [
  { id: 1, name: 'All Volunteers' },
  { id: 2, name: 'Event Organizers' },
  { id: 3, name: 'Admins' }
];

// Will use shared mock data for scheduled/history/templates

export default function AdminCommunications() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const handleSend = () => {
    // In a real app this would call an API – here we just log to console
    console.log('Sending message', { subject, body, recipient });
    alert('Message queued (mock)');
    setSubject('');
    setBody('');
    setRecipient('');
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
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
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
          <Textarea placeholder="Message body…" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={!subject || !body || !recipient}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Template preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name || 'Template Preview'}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Type: {previewTemplate?.type}</div>
            <div className="bg-gray-50 p-4 rounded text-sm">
              This is a mock preview of the template content for <strong>{previewTemplate?.name}</strong>.
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button onClick={() => setPreviewOpen(false)} variant="outline">
                Close
              </Button>
              <Button
                onClick={() => {
                  setPreviewOpen(false);
                  alert('Inserted template (mock)');
                }}
              >
                Insert
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduled Messages */}
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Engagement Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                  <div>Open Rate</div>
                  <div className="font-medium">45%</div>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                  <div>Click Rate</div>
                  <div className="font-medium">12%</div>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Opened', value: 45 },
                          { name: 'Not Opened', value: 55 }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        innerRadius={35}
                      >
                        <Cell fill="#60a5fa" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Library */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Template Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                    <div className="text-sm">
                      {t.name} — {t.type}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs text-muted-foreground hover:underline"
                        onClick={() => {
                          setPreviewTemplate(t);
                          setPreviewOpen(true);
                        }}
                      >
                        Preview
                      </button>
                      <button className="text-xs text-blue-600">Use</button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Scheduled Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">Showing next 5 scheduled messages</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Send At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commScheduled.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>{msg.subject}</TableCell>
                      <TableCell>{msg.sendAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
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
              {commScheduled.map((msg) => (
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
              {commHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.subject}</TableCell>
                  <TableCell>{h.sentAt}</TableCell>
                  <TableCell>
                    <Badge variant={h.status === 'Sent' ? 'default' : 'destructive'}>{h.status}</Badge>
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
