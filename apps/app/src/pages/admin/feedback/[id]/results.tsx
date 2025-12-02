import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function AdminSurveyResults() {
  const { id } = useParams();
  const { data: survey } = useQuery(['survey', id], () => api.getSurvey(Number(id)), { enabled: !!id });
  const { data: responses } = useQuery(['survey-responses', id], () => api.listSurveyResponses(Number(id)), {
    enabled: !!id
  });

  if (!survey) return <div>Loading...</div>;

  const qlist: any[] = survey.questions || [];

  const aggregates: Record<number, { count: number; total: number }> = {};
  (responses || []).forEach((r: any) => {
    try {
      const a = r.answers ? JSON.parse(r.answers) : {};
      qlist.forEach((q, idx) => {
        const val = a[idx];
        if (q.type === 'rating') {
          aggregates[idx] = aggregates[idx] || { count: 0, total: 0 };
          if (typeof val === 'number') {
            aggregates[idx].count += 1;
            aggregates[idx].total += Number(val);
          }
        }
      });
    } catch (e) {
      // ignore
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Results: {survey.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>Responses: {(responses || []).length}</div>
            {qlist.map((q, idx) => {
              const dataMap: Record<string | number, number> = {};
              for (const r of responses || []) {
                try {
                  const a = r.answers ? JSON.parse(r.answers) : {};
                  const val = a[idx];
                  if (val === null || val === undefined) continue;
                  if (Array.isArray(val)) {
                    for (const v of val) dataMap[v] = (dataMap[v] || 0) + 1;
                  } else {
                    dataMap[val] = (dataMap[val] || 0) + 1;
                  }
                } catch (e) {}
              }

              const chartData = Object.keys(dataMap).map((k) => ({ name: String(k), value: dataMap[k] }));

              return (
                <div key={idx} className="p-2 border rounded">
                  <div className="font-medium mb-2">{q.question}</div>
                  {q.type === 'rating' ? (
                    <div style={{ width: '100%', height: 160 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={
                            chartData.length
                              ? chartData
                              : Array.from({ length: q.scale || 5 }, (_, i) => ({ name: String(i + 1), value: 0 }))
                          }
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#4f46e5" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-2">
                        Average:{' '}
                        {aggregates[idx] && aggregates[idx].count > 0
                          ? (aggregates[idx].total / aggregates[idx].count).toFixed(2)
                          : '—'}
                      </div>
                    </div>
                  ) : q.type === 'multiple_choice' || q.type === 'checkbox' ? (
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
                            {chartData.map((entry, i) => (
                              <Cell
                                key={`cell-${i}`}
                                fill={['#4f46e5', '#10b981', '#f97316', '#ef4444', '#60a5fa'][i % 5]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No visual available</div>
                  )}
                </div>
              );
            })}
            <div className="mt-4">
              <Button
                onClick={() =>
                  api.exportSurveyResponses(Number(id)).then((b: any) => {
                    const url = window.URL.createObjectURL(b.data);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `survey-${id}-responses.csv`;
                    a.click();
                  })
                }
              >
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
