import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';

export default function AdminCalendar() {
  const { data: urlsRaw, isLoading } = useQuery(['admin', 'calendar', 'urls'], () => api.getCalendarSubscriptionUrls());
  const urls = urlsRaw?.data ?? urlsRaw ?? {};
  const [range, setRange] = useState('30days');

  const download = async (fn: any, name: string, params?: any) => {
    try {
      const res: any = await fn(params ?? {});
      const blob = res?.data ?? res;
      const b = blob instanceof Blob ? blob : new Blob([String(blob)], { type: 'text/calendar' });
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Download started' });
    } catch (e: any) {
      toast({ title: 'Download failed', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin — Calendars</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Subscription URLs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Input value={urls?.subscriptionUrl ?? urls?.mySchedule ?? ''} readOnly />
                <Button
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(urls?.subscriptionUrl ?? urls?.mySchedule ?? '')}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Download Calendars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm block mb-1">Range (eg. 30days)</label>
              <Input value={range} onChange={(e: any) => setRange(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  download(() => api.getPublicOpportunitiesCalendar({ range }), 'public-opportunities-calendar')
                }
              >
                Download Public Opportunities
              </Button>
              <Button onClick={() => download(() => api.getEventsCalendar({ range }), 'events-calendar')}>
                Download Events
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
