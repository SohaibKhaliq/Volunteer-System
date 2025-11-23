// src/pages/admin/communications.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, CalendarClock, FileText, Edit, Trash2, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { commTemplates as templatesMock, commScheduled, commHistory } from '@/lib/mock/adminMock';

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
  const [channels, setChannels] = useState({ email: true, sms: false });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [smsNumber, setSmsNumber] = useState('');

  // Templates local state for CRUD
  const [templates, setTemplates] = useState(() => templatesMock.slice());
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateEditOpen, setTemplateEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateDeleteOpen, setTemplateDeleteOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);

  const saveTemplate = (payload: any) => {
    if (payload.id) {
      const next = templates.map((t) => (t.id === payload.id ? { ...t, ...payload } : t));
      setTemplates(next);
      const idx = templatesMock.findIndex((m) => m.id === payload.id);
      if (idx !== -1) Object.assign(templatesMock[idx], payload);
    } else {
      const id = Math.max(0, ...templates.map((t) => t.id)) + 1;
      const nt = { ...payload, id };
      setTemplates([nt, ...templates]);
      templatesMock.unshift(nt);
    }
    setEditingTemplate(null);
    setTemplateEditOpen(false);
  };

  const confirmDeleteTemplate = (id: number) => {
    setTemplateToDelete(id);
    setTemplateDeleteOpen(true);
  };

  const doDeleteTemplate = () => {
    if (templateToDelete == null) return;
    setTemplates((t) => t.filter((x) => x.id !== templateToDelete));
    const idx = templatesMock.findIndex((m) => m.id === templateToDelete);
    if (idx !== -1) templatesMock.splice(idx, 1);
    setTemplateToDelete(null);
    setTemplateDeleteOpen(false);
  };

  const generateFromTemplate = (t: any) => {
    // Create a simple generated subject/body based on template metadata
    const generatedSubject = `${t.type} — ${t.name}`;
    const generatedBody = `Hello {{first_name}},\n\nThis is a ${t.type.toLowerCase()} message: ${t.name}.\n\nThanks,\nYour Team`;
    return { ...t, subject: generatedSubject, body: generatedBody };
  };

  const handleSend = () => {
    // In a real app this would call an API – here we just log to console
    console.log('Sending message', { subject, body, recipient });
    alert('Message queued (mock)');
    setSubject('');
    setBody('');
    setRecipient('');
  };

  return (
    <div className="space-y-6" aria-busy={false}>
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
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={() => setChannels((c) => ({ ...c, email: !c.email }))}
                aria-label="Send via Email"
              />
              <span>Email</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={channels.sms}
                onChange={() => setChannels((c) => ({ ...c, sms: !c.sms }))}
                aria-label="Send via SMS"
              />
              <span>SMS</span>
            </label>
            {channels.sms && (
              <Input
                placeholder="Test phone number (optional)"
                value={smsNumber}
                onChange={(e) => setSmsNumber(e.target.value)}
                className="w-56"
                aria-label="SMS test number"
              />
            )}
          </div>

          <Textarea placeholder="Message body…" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Channels: {channels.email ? 'Email' : ''}
              {channels.sms ? (channels.email ? ', SMS' : 'SMS') : ''}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={!subject || !body || !recipient}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Edit Dialog */}
      <Dialog open={templateEditOpen} onOpenChange={setTemplateEditOpen}>
        <DialogContent aria-labelledby="template-edit-title">
          <DialogHeader>
            <DialogTitle id="template-edit-title">{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Name</label>
              <Input
                value={editingTemplate?.name || ''}
                onChange={(e) => setEditingTemplate((s: any) => ({ ...(s || {}), name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Type</label>
              <Select
                value={editingTemplate?.type || 'Reminder'}
                onValueChange={(v) => setEditingTemplate((s: any) => ({ ...(s || {}), type: v }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Welcome">Welcome</SelectItem>
                  <SelectItem value="Reminder">Reminder</SelectItem>
                  <SelectItem value="Thank you">Thank you</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm block mb-1">Body</label>
              <Textarea
                rows={6}
                value={editingTemplate?.body || ''}
                onChange={(e) => setEditingTemplate((s: any) => ({ ...(s || {}), body: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTemplateEditOpen(false);
                  setEditingTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editingTemplate?.name) {
                    alert('Template name required');
                    return;
                  }
                  saveTemplate(editingTemplate || {});
                }}
              >
                {editingTemplate ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Delete Confirmation */}
      <Dialog open={templateDeleteOpen} onOpenChange={setTemplateDeleteOpen}>
        <DialogContent aria-labelledby="template-delete-title">
          <DialogHeader>
            <DialogTitle id="template-delete-title">Delete Template</DialogTitle>
          </DialogHeader>
          <div className="p-4">Are you sure you want to delete this template?</div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTemplateDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={doDeleteTemplate}>
                Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Template preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent aria-labelledby="template-preview-title">
          <DialogHeader>
            <DialogTitle id="template-preview-title">
              {previewTemplate?.subject || previewTemplate?.name || 'Template Preview'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="text-sm text-muted-foreground mb-2">Type: {previewTemplate?.type}</div>
            <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
              {previewTemplate?.body
                ? (previewTemplate.body as string).replace(/{{\s*first_name\s*}}/gi, 'Alex')
                : `This is a mock preview of the template content for ${previewTemplate?.name}.`}
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button onClick={() => setPreviewOpen(false)} variant="outline">
                Close
              </Button>
              <Button
                onClick={() => {
                  if (previewTemplate) {
                    setSubject(previewTemplate.subject || '');
                    setBody(previewTemplate.body || '');
                    setRecipient('All Volunteers');
                  }
                  setPreviewOpen(false);
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    placeholder="Search templates"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                  />
                  <div className="ml-auto">
                    <Button
                      onClick={() => {
                        setEditingTemplate(null);
                        setTemplateEditOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </div>
                </div>

                {templates.filter((t) =>
                  templateSearch ? `${t.name} ${t.type}`.toLowerCase().includes(templateSearch.toLowerCase()) : true
                ).length === 0 ? (
                  <SkeletonCard />
                ) : (
                  templates
                    .filter((t) =>
                      templateSearch ? `${t.name} ${t.type}`.toLowerCase().includes(templateSearch.toLowerCase()) : true
                    )
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                        <div className="text-sm">
                          {t.name} — {t.type}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-xs text-muted-foreground hover:underline"
                            onClick={() => {
                              const p = generateFromTemplate(t);
                              setPreviewTemplate(p);
                              setPreviewOpen(true);
                            }}
                            aria-label={`Preview ${t.name}`}
                          >
                            Preview
                          </button>
                          <button
                            className="text-xs text-blue-600"
                            onClick={() => {
                              const p = generateFromTemplate(t);
                              setSubject(p.subject);
                              setBody(p.body);
                              setRecipient('All Volunteers');
                            }}
                            aria-label={`Use ${t.name}`}
                          >
                            Use
                          </button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditingTemplate(t);
                              setTemplateEditOpen(true);
                            }}
                            aria-label={`Edit template ${t.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => confirmDeleteTemplate(t.id)}
                            aria-label={`Delete template ${t.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
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
