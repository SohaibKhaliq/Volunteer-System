import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/atoms/use-toast';
import { useApp } from '@/providers/app-provider';

export default function TakeSurvey() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: survey }: any = useQuery(['survey', id], () => api.getSurvey(Number(id)), { enabled: !!id });
  const [answers, setAnswers] = useState<Record<number | string, any>>({});
  const { user } = useApp();
  const navigate = useNavigate();

  const isAdmin = !!(
    user?.isAdmin ||
    user?.is_admin ||
    (user?.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: any) => {
        const n = (r?.name || r?.role || '').toLowerCase();
        return n === 'admin' || n === 'organization_admin' || n === 'organization_manager';
      }))
  );

  const isVolunteer = !!(
    (user?.role && String(user.role).toLowerCase() === 'volunteer') ||
    (user?.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: any) => (r?.name || r?.role || '').toLowerCase() === 'volunteer'))
  );

  useEffect(() => {
    // Admins should manage surveys from admin dashboard
    if (isAdmin) {
      navigate('/admin/feedback');
    }
  }, [isAdmin]);

  // enforce volunteer-only access
  useEffect(() => {
    if (!user) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
      navigate(`/login?returnTo=${returnTo}`);
    }
  }, [user]);

  if (user && !isVolunteer && !isAdmin) {
    return <div className="p-6">Only volunteers can take surveys.</div>;
  }

  // load/save draft to localStorage
  useEffect(() => {
    try {
      const key = `survey-draft-${id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        setAnswers(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    const key = `survey-draft-${id}`;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(answers || {}));
      } catch (e) {
        // ignore
      }
    }, 400);
    return () => clearTimeout(t);
  }, [answers, id]);

  const submit = useMutation((payload: any) => api.submitSurveyResponse(Number(id), payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['surveys']);
      toast.success('Response submitted');
      // clear draft
      try {
        localStorage.removeItem(`survey-draft-${id}`);
      } catch (e) {}
      navigate('/');
    },
    onError: () => toast.error('Failed to submit')
  });

  if (!survey) return <div>Loading...</div>;

  // check settings for expiration
  let surveySettings: any = {};
  try {
    surveySettings = survey.settings
      ? typeof survey.settings === 'string'
        ? JSON.parse(survey.settings)
        : survey.settings
      : {};
  } catch (e) {
    surveySettings = {};
  }
  if (surveySettings.expirationDate && new Date(surveySettings.expirationDate) < new Date()) {
    return <div>This survey has expired.</div>;
  }

  const qlist: any[] = survey.questions || [];

  const setAnswer = (idx: number, value: any) => setAnswers((s) => ({ ...(s || {}), [idx]: value }));

  const doSubmit = () => {
    // validate required
    const qlist: any[] = survey.questions || [];
    for (let i = 0; i < qlist.length; i++) {
      const q = qlist[i];
      if (q.required) {
        const v = answers[i];
        if (
          v === undefined ||
          v === null ||
          (typeof v === 'string' && v.trim() === '') ||
          (Array.isArray(v) && v.length === 0)
        ) {
          toast.error('Please answer all required questions');
          return;
        }
      }
    }
    submit.mutate({ answers });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qlist.map((q: any, i: number) => (
              <div key={i} className="p-2 border rounded">
                <div className="font-medium">{q.question}</div>
                {q.type === 'short_text' ? (
                  <Input value={answers[i] || ''} onChange={(e) => setAnswer(i, e.target.value)} />
                ) : q.type === 'long_text' ? (
                  <textarea
                    className="w-full border rounded p-2"
                    value={answers[i] || ''}
                    onChange={(e) => setAnswer(i, e.target.value)}
                  />
                ) : q.type === 'rating' ? (
                  <select
                    value={answers[i] || ''}
                    onChange={(e) => setAnswer(i, Number(e.target.value))}
                    className="w-full border rounded p-1"
                  >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                ) : q.type === 'multiple_choice' ? (
                  <select
                    value={answers[i] || ''}
                    onChange={(e) => setAnswer(i, e.target.value)}
                    className="w-full border rounded p-1"
                  >
                    <option value="">Select</option>
                    {(q.options || []).map((o: any, idx: number) => (
                      <option key={idx} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : q.type === 'checkbox' ? (
                  (q.options || []).map((o: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Array.isArray(answers[i]) && answers[i].includes(o)}
                        onChange={(e) => {
                          const arr = Array.isArray(answers[i]) ? [...answers[i]] : [];
                          if (e.target.checked) arr.push(o);
                          else arr.splice(arr.indexOf(o), 1);
                          setAnswer(i, arr);
                        }}
                      />
                      <span>{o}</span>
                    </div>
                  ))
                ) : null}
              </div>
            ))}

            <div className="flex gap-2">
              <Button onClick={() => doSubmit()}>Submit</Button>
              <Button variant="outline" onClick={() => navigate('/feedback')}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
