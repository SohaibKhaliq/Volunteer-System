import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';

export default function SettingsCalendar() {
  const { data: urlsRaw, isLoading } = useQuery(['calendar', 'urls'], () => api.getCalendarSubscriptionUrls());
  const urls = urlsRaw?.data ?? urlsRaw ?? {};
  // track clipboard actions in UI if needed later

  const copy = async (s: string) => {
    try {
      await navigator.clipboard.writeText(s);
      toast({ title: 'Copied to clipboard' });
    } catch (e: any) {
      toast({ title: 'Copy failed', description: String(e), variant: 'destructive' });
    }
  };

  const downloadCalendar = async (fn: () => Promise<any>, name: string) => {
    try {
      const res: any = await fn();
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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendar & Subscriptions</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Your subscription URLs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">My schedule</div>
                  <Input value={urls?.mySchedule ?? ''} readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => copy(urls?.mySchedule)} disabled={!urls?.mySchedule}>
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCalendar(api.getMyScheduleCalendar, 'my-schedule')}
                    disabled={!urls?.mySchedule}
                  >
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Public opportunities</div>
                  <Input value={urls?.publicOpportunities ?? ''} readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => copy(urls?.publicOpportunities)}
                    disabled={!urls?.publicOpportunities}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCalendar(api.getPublicOpportunitiesCalendar, 'public-opportunities')}
                    disabled={!urls?.publicOpportunities}
                  >
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Events</div>
                  <Input value={urls?.events ?? ''} readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => copy(urls?.events)} disabled={!urls?.events}>
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadCalendar(() => api.getEventsCalendar({}, { responseType: 'blob' } as any), 'events')
                    }
                    disabled={!urls?.events}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
