import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

const REPORT_TYPES = ['users', 'organizations', 'hours', 'events', 'compliance', 'applications'];

export default function AdminExports() {
  const [reportType, setReportType] = useState('users');
  const [range, setRange] = useState('30days');
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');

  const downloadMutation = useMutation({
    mutationFn: async () => {
      // use downloadReport for standard reports which returns a blob
      const blob: any = await api.downloadReport(reportType, format);
      return blob;
    },
    onSuccess: (res: any) => {
      try {
        // axios with responseType blob returns a Blob or an AxiosResponse with .data
        const data = res?.data ?? res;
        if (!(data instanceof Blob)) {
          // If server returns JSON with a url or string, try to handle it conservatively
          const maybeUrl = typeof data === 'string' ? data : (data?.url ?? data?.downloadUrl);
          if (maybeUrl) {
            const a = document.createElement('a');
            a.href = String(maybeUrl);
            a.target = '_blank';
            a.rel = 'noreferrer';
            a.click();
            toast({ title: 'Export ready', description: 'Download opened in a new tab' });
            return;
          }
        }

        const blobObj = data instanceof Blob ? data : new Blob([JSON.stringify(data)], { type: 'text/plain' });
        const url = URL.createObjectURL(blobObj);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-${range || 'all'}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast({ title: 'Export ready', description: 'Download started' });
      } catch (e: any) {
        toast({ title: 'Download failed', description: String(e), variant: 'destructive' });
      }
    },
    onError: (err: any) => {
      toast({ title: 'Export failed', description: String(err), variant: 'destructive' });
    }
  });

  const summaryMutation = useMutation({
    mutationFn: async () => {
      // admin summary may return a downloadable file or data, handle both
      const res: any = await api.exportAdminSummary(format);
      return res;
    },
    onSuccess: (res: any) => {
      const data = res?.data ?? res;
      // try same logic as above
      if (data instanceof Blob) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `platform-summary.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast({ title: 'Summary ready', description: 'Download started' });
        return;
      }

      // fallback: if server returns an object with url
      const maybeUrl = data?.url ?? data?.downloadUrl ?? (typeof data === 'string' ? data : null);
      if (maybeUrl) {
        window.open(String(maybeUrl), '_blank');
        toast({ title: 'Summary ready', description: 'Opened in new tab' });
        return;
      }

      toast({ title: 'Summary created', description: 'Check server or logs for details' });
    },
    onError: (err: any) => toast({ title: 'Summary export failed', description: String(err), variant: 'destructive' })
  });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exports & Reports</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm font-medium">Report</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
              >
                {REPORT_TYPES.map((r) => (
                  <option value={r} key={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Range</label>
              <Input value={range} onChange={(e: any) => setRange(e.target.value)} placeholder="30days" />
            </div>

            <div>
              <label className="text-sm font-medium">Format</label>
              <div className="flex gap-2 mt-1">
                <button
                  className={`px-3 py-2 rounded border ${format === 'csv' ? 'bg-primary text-white' : ''}`}
                  onClick={() => setFormat('csv')}
                >
                  CSV
                </button>
                <button
                  className={`px-3 py-2 rounded border ${format === 'xlsx' ? 'bg-primary text-white' : ''}`}
                  onClick={() => setFormat('xlsx')}
                >
                  XLSX
                </button>
                <button
                  className={`px-3 py-2 rounded border ${format === 'pdf' ? 'bg-primary text-white' : ''}`}
                  onClick={() => setFormat('pdf')}
                >
                  PDF
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button disabled={downloadMutation.isLoading} onClick={() => downloadMutation.mutate()}>
              {downloadMutation.isLoading ? 'Downloading...' : 'Download Report'}
            </Button>
            <Button disabled={summaryMutation.isLoading} variant="outline" onClick={() => summaryMutation.mutate()}>
              {summaryMutation.isLoading ? 'Preparing...' : 'Export Platform Summary'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mt-3">
            Tip: If downloads do not start, the server might be returning a URL — the UI will open it in a new tab.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
