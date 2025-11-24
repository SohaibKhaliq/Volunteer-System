// src/pages/admin/feedback.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { toast } from '@/components/atoms/use-toast';
import { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function AdminFeedback() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newSurvey, setNewSurvey] = useState<any>({});
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: api.listSurveys
  });

  const surveys = Array.isArray(data) ? data : [];

  const createMutation = useMutation({
    mutationFn: api.createSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Survey created successfully');
      setCreateOpen(false);
      setNewSurvey({});
    },
    onError: (err: any) => {
      console.error('Create survey error', err);
      const details = err?.response?.data?.details || err?.message || 'Failed to create survey';
      toast.error(String(details));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateSurvey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Survey updated successfully');
      setCreateOpen(false);
      setNewSurvey({});
      setEditingId(null);
    },
    onError: (err: any) => {
      console.error('Update survey error', err);
      const details = err?.response?.data?.details || err?.message || 'Failed to update survey';
      toast.error(String(details));
    }
  });

  const responsesQuery = useQuery({
    queryKey: ['surveyResponses', selectedSurvey?.id],
    queryFn: () => (selectedSurvey ? api.listSurveyResponses(selectedSurvey.id) : Promise.resolve([])),
    enabled: !!selectedSurvey && viewOpen
  });

  const exportResponses = async (id: number) => {
    try {
      const blob = await api.exportSurveyResponses(id, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey-${id}-responses.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to export responses');
    }
  };

  const handleToggleStatus = (survey: any) => {
    const newStatus = survey.status === 'Open' ? 'Closed' : 'Open';
    updateMutation.mutate({ id: survey.id, data: { ...survey, status: newStatus } });
  };

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Feedback & Surveys
            </CardTitle>
            <Button
              onClick={() => {
                setEditingId(null);
                setNewSurvey({});
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Survey
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : surveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No surveys found
                  </TableCell>
                </TableRow>
              ) : (
                surveys.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.responses?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'Open' ? 'secondary' : 'default'}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(s)}>
                          {s.status === 'Open' ? 'Close' : 'Reopen'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSurvey(s);
                            setViewOpen(true);
                          }}
                        >
                          View Results
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // open edit dialog with prefilled data
                            const surveyCopy = { ...s };
                            // ensure questions is an array
                            if (typeof surveyCopy.questions === 'string') {
                              try {
                                surveyCopy.questions = JSON.parse(surveyCopy.questions || '[]');
                              } catch {
                                surveyCopy.questions = [];
                              }
                            }
                            setNewSurvey(surveyCopy);
                            setEditingId(s.id);
                            setCreateOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Survey Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Survey' : 'Create New Survey'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-sm block mb-1">Title</label>
              <Input
                value={newSurvey.title || ''}
                onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Description</label>
              <Input
                value={newSurvey.description || ''}
                onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
              />
            </div>
            {/* Questionnaire editor */}
            <div>
              <label className="text-sm block mb-1">Questions</label>
              <div className="space-y-2">
                {(newSurvey.questions || []).map((q: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded space-y-2">
                    <Input
                      placeholder={`Question ${idx + 1}`}
                      value={q.question}
                      onChange={(e) => {
                        const arr = [...(newSurvey.questions || [])];
                        arr[idx] = { ...arr[idx], question: e.target.value };
                        setNewSurvey({ ...newSurvey, questions: arr });
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Select
                        value={q.type || 'text'}
                        onValueChange={(v) => {
                          const arr = [...(newSurvey.questions || [])];
                          arr[idx] = { ...arr[idx], type: v };
                          setNewSurvey({ ...newSurvey, questions: arr });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const arr = [...(newSurvey.questions || [])];
                          arr.splice(idx, 1);
                          setNewSurvey({ ...newSurvey, questions: arr });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    {q.type === 'multiple_choice' && (
                      <div>
                        <label className="text-xs block mb-1">Options (comma separated)</label>
                        <Input
                          value={(q.options || []).join(',')}
                          onChange={(e) => {
                            const opts = e.target.value.split(',').map((s) => s.trim());
                            const arr = [...(newSurvey.questions || [])];
                            arr[idx] = { ...arr[idx], options: opts };
                            setNewSurvey({ ...newSurvey, questions: arr });
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() =>
                    setNewSurvey({
                      ...newSurvey,
                      questions: [...(newSurvey.questions || []), { question: '', type: 'text', options: [] }]
                    })
                  }
                >
                  Add Question
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Status</label>
              <Select
                value={newSurvey.status || 'Open'}
                onValueChange={(v) => setNewSurvey({ ...newSurvey, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newSurvey.title) {
                  toast.error('Title is required');
                  return;
                }
                const payload = { ...newSurvey, questions: newSurvey.questions || [] };
                if (editingId) {
                  updateMutation.mutate({ id: editingId, data: payload });
                  setEditingId(null);
                } else {
                  createMutation.mutate(payload);
                }
              }}
            >
              {editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Results Dialog */}
      <Dialog
        open={viewOpen}
        onOpenChange={(v) => {
          setViewOpen(v);
          if (!v) setSelectedSurvey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Survey Results</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {!selectedSurvey ? (
              <div>No survey selected</div>
            ) : responsesQuery.isLoading ? (
              <div>Loading responses...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedSurvey.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedSurvey.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => exportResponses(selectedSurvey.id)}>
                      Export CSV
                    </Button>
                  </div>
                </div>
                {/* parse questions */}
                {(() => {
                  const qs =
                    typeof selectedSurvey.questions === 'string'
                      ? (() => {
                          try {
                            return JSON.parse(selectedSurvey.questions);
                          } catch {
                            return [];
                          }
                        })()
                      : selectedSurvey.questions || [];

                  const responses = Array.isArray(responsesQuery.data) ? responsesQuery.data : [];

                  if (!qs.length) return <div>No questions defined</div>;

                  return qs.map((q: any, qi: number) => {
                    if (q.type === 'multiple_choice') {
                      // aggregate counts
                      const counts: Record<string, number> = {};
                      responses.forEach((r: any) => {
                        const ans = r.answers ? JSON.parse(r.answers || 'null') : null;
                        if (!ans) return;
                        const a = ans[qi];
                        if (!a) return;
                        counts[a] = (counts[a] || 0) + 1;
                      });

                      const chartData = (q.options || Object.keys(counts || {})).map((opt: string) => ({
                        name: opt,
                        value: counts[opt] || 0
                      }));

                      const colors = ['#4f46e5', '#0ea5e9', '#f97316', '#10b981', '#ef4444', '#a78bfa'];

                      return (
                        <div key={qi} className="p-3 border rounded">
                          <div className="font-medium mb-2">{q.question}</div>
                          <div style={{ width: '100%', height: 240 }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie dataKey="value" data={chartData} nameKey="name" outerRadius={80} label>
                                  {chartData.map((entry: any, idx: number) => (
                                    <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  labelFormatter={(label: any) =>
                                    typeof label === 'object' ? JSON.stringify(label) : String(label)
                                  }
                                  formatter={(value: any) => (value == null ? '' : value)}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-4">
                            <ResponsiveContainer width="100%" height={120}>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                  labelFormatter={(label: any) =>
                                    typeof label === 'object' ? JSON.stringify(label) : String(label)
                                  }
                                  formatter={(value: any) => (value == null ? '' : value)}
                                />
                                <Bar dataKey="value" fill={colors[0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    }
                    // text answers: list raw
                    return (
                      <div key={qi} className="p-3 border rounded">
                        <div className="font-medium">{q.question}</div>
                        <div className="mt-2 space-y-2">
                          {responses.length === 0 && <div className="text-sm text-muted-foreground">No responses</div>}
                          {responses.map((r: any) => {
                            const ans = r.answers ? JSON.parse(r.answers || 'null') : null;
                            return (
                              <div key={r.id} className="text-sm">
                                {ans ? String(ans[qi] ?? '') : ''}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
