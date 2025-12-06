import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/atoms/use-toast';
import { Plus, Edit, Trash } from 'lucide-react';

export default function AdminTemplates() {
  const queryClient = useQueryClient();
  const { data: templatesRaw, isLoading } = useQuery(['notification', 'templates'], () =>
    api.getNotificationTemplates()
  );

  // normalize results (api may return array or wrapped data)
  const templates: any[] = (() => {
    if (!templatesRaw) return [];
    if (Array.isArray(templatesRaw)) return templatesRaw;
    return templatesRaw?.data ?? [];
  })();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ key: '', subject: '', body: '' });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return api.updateNotificationTemplate(editing.key, payload);
      return api.createNotificationTemplate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notification', 'templates']);
      toast({ title: 'Template saved' });
      setOpen(false);
    },
    onError: (err: any) => toast({ title: 'Save failed', description: String(err), variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => api.deleteNotificationTemplate(key),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification', 'templates']);
      toast({ title: 'Template deleted' });
    }
  });

  const previewTemplate = async (t: any) => {
    try {
      const res: any = await api.previewNotificationTemplate({ key: t.key, subject: t.subject, body: t.body });
      // in a real app we'd show the preview as a modal or in-line rendering. We'll show a toast for now.
      toast({ title: 'Preview generated', description: String(res?.message ?? 'Preview ready') });
    } catch (e) {
      toast({ title: 'Preview failed', description: String(e), variant: 'destructive' });
    }
  };

  const openForCreate = () => {
    setEditing(null);
    setForm({ key: '', subject: '', body: '' });
    setOpen(true);
  };

  const openForEdit = (t: any) => {
    setEditing(t);
    setForm({ key: t.key, subject: t.subject || '', body: t.body || '' });
    setOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notification Templates</h2>
        <Button onClick={openForCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3}>Loading templates…</TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-center">
                      No templates found
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((t) => (
                    <TableRow key={t.key}>
                      <TableCell>{t.key}</TableCell>
                      <TableCell className="line-clamp-1">{t.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openForEdit(t)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => previewTemplate(t)}>
                            Preview
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(t.key)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-sm font-medium">Template Key</label>
              <Input
                value={form.key}
                onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))}
                placeholder="unique.key"
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <Textarea value={form.body} onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // preview using the current form
                  previewTemplate(form);
                }}
              >
                Preview
              </Button>
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isLoading}>
                {saveMutation.isLoading ? 'Saving...' : editing ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
