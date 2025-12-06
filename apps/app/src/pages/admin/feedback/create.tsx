import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/atoms/use-toast';

function emptyQuestion(id?: string) {
  return { id: id || `q_${Date.now()}`, question: '', type: 'short_text', options: [], required: false, scale: 5 };
}

export default function AdminCreateSurvey() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing } = useQuery(['survey', id], () => (id ? api.getSurvey(Number(id)) : Promise.resolve(null)), {
    enabled: !!id
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<any[]>([emptyQuestion()]);
  const [anonymous, setAnonymous] = useState(false);
  const [allowMultipleResponses, setAllowMultipleResponses] = useState(false);
  const [expiration, setExpiration] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (existing) {
      const s: any = existing as any;
      setTitle(s.title || '');
      setDescription(s.description || '');
      const qs =
        s.questions && s.questions.length
          ? s.questions.map((q: any, i: number) => ({
              id: q.id || `q_${i}_${Date.now()}`,
              required: q.required || false,
              scale: q.scale || (q.type === 'rating' ? q.scale || 5 : undefined),
              ...q
            }))
          : [emptyQuestion()];
      setQuestions(qs);
      try {
        const settings = s.settings ? (typeof s.settings === 'string' ? JSON.parse(s.settings) : s.settings) : {};
        setAnonymous(!!settings.anonymous);
        setAllowMultipleResponses(!!settings.allowMultipleResponses);
        setExpiration(settings.expirationDate ?? null);
      } catch (e) {
        setAnonymous(false);
        setAllowMultipleResponses(false);
      }
    }
  }, [existing]);

  const saveMutation = useMutation(
    async (payload: any) => {
      if (id) return api.updateSurvey(Number(id), payload);
      return api.createSurvey(payload);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['surveys']);
        toast.success('Survey saved');
        navigate('/admin/feedback');
      },
      onError: () => toast.error('Failed to save survey')
    }
  );

  const addQuestion = () => setQuestions((s) => [...s, emptyQuestion()]);
  const updateQuestion = (idx: number, patch: any) =>
    setQuestions((s) => s.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  const removeQuestion = (idx: number) => setQuestions((s) => s.filter((_, i) => i !== idx));
  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    setQuestions((s) => {
      const copy = [...s];
      const tmp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = tmp;
      return copy;
    });
  };
  const moveDown = (idx: number) => {
    setQuestions((s) => {
      if (idx >= s.length - 1) return s;
      const copy = [...s];
      const tmp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = tmp;
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit Survey' : 'New Survey'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Questions</h4>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setPreview((p) => !p)}>{preview ? 'Hide Preview' : 'Preview'}</Button>
                  <Button onClick={addQuestion}>Add</Button>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 border rounded">
                    <div className="mb-2">
                      <label className="text-sm block mb-1">Question</label>
                      <Input value={q.question} onChange={(e) => updateQuestion(idx, { question: e.target.value })} />
                    </div>
                    <div className="mb-2">
                      <label className="text-sm block mb-1">Type</label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={q.type}
                        onChange={(e) => updateQuestion(idx, { type: e.target.value })}
                      >
                        <option value="short_text">Short Text</option>
                        <option value="long_text">Long Text</option>
                        <option value="rating">Rating</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="likert">Likert Scale</option>
                      </select>
                    </div>
                    {q.type === 'multiple_choice' || q.type === 'checkbox' ? (
                      <div>
                        <label className="text-sm block mb-1">Options (comma separated)</label>
                        <Input
                          value={(q.options || []).join(',')}
                          onChange={(e) => updateQuestion(idx, { options: String(e.target.value).split(',') })}
                        />
                      </div>
                    ) : null}
                    {q.type === 'rating' ? (
                      <div className="mb-2">
                        <label className="text-sm block mb-1">Scale</label>
                        <select
                          className="w-full border rounded px-2 py-1"
                          value={q.scale || 5}
                          onChange={(e) => updateQuestion(idx, { scale: Number(e.target.value) })}
                        >
                          <option value={5}>1-5</option>
                          <option value={10}>1-10</option>
                        </select>
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!q.required}
                          onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                        />
                        <span className="text-sm">Required</span>
                      </label>
                      <div className="flex gap-2">
                        <Button onClick={() => moveUp(idx)} disabled={idx === 0} variant="outline">
                          Up
                        </Button>
                        <Button onClick={() => moveDown(idx)} disabled={idx === questions.length - 1} variant="outline">
                          Down
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button onClick={() => removeQuestion(idx)} variant="destructive">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 border rounded">
              <h4 className="font-medium mb-2">Settings</h4>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                  <span>Allow anonymous responses</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allowMultipleResponses}
                    onChange={(e) => setAllowMultipleResponses(e.target.checked)}
                  />
                  <span>Allow multiple responses per volunteer</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="text-sm block mb-1">Expiration date (optional)</label>
                <Input type="date" value={expiration ?? ''} onChange={(e) => setExpiration(e.target.value || null)} />
              </div>
            </div>

            {preview ? (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="space-y-2">
                  {questions.map((q: any, i: number) => (
                    <div key={q.id || i} className="p-2 border rounded">
                      <div className="font-medium">
                        {q.question} {q.required ? '*' : ''}
                      </div>
                      {q.type === 'short_text' ? <Input disabled placeholder="Short answer" /> : null}
                      {q.type === 'long_text' ? <textarea disabled className="w-full border rounded p-2" /> : null}
                      {q.type === 'rating' ? (
                        <div className="flex gap-2 mt-2">
                          {Array.from({ length: q.scale || 5 }, (_, n) => (
                            <button key={n} className="px-2 py-1 border rounded">
                              {n + 1}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {q.type === 'multiple_choice' ? (
                        <div className="mt-2">
                          {(q.options || []).map((o: string, idx: number) => (
                            <div key={idx}>{o}</div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!title) return toast.error('Title required');
                  const qs = questions.map((q: any, i: number) => ({ id: q.id || `q_${i}_${Date.now()}`, ...q }));
                  const settings = { anonymous, allowMultipleResponses, expirationDate: expiration };
                  saveMutation.mutate({ title, description, questions: qs, settings });
                }}
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/feedback')}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
