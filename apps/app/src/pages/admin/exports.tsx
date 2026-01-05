import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/atoms/use-toast';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { Download, FileDown, FileJson, FileSpreadsheet } from 'lucide-react';

const EXPORT_TYPES = [
  { value: 'users', label: 'Users & Volunteers' },
  { value: 'events', label: 'Events' },
  { value: 'shifts', label: 'Shifts' },
  { value: 'opportunities', label: 'Opportunities' },
  { value: 'organizations', label: 'Organization Info' }
];

export default function AdminExports() {
  const [exportType, setExportType] = useState('users');
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const downloadMutation = useMutation({
    mutationFn: async () => {
      // Use the new generic download endpoint
      const res: any = await api.downloadGenericExport(exportType, format as any, {
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      return res;
    },
    onSuccess: (res: any) => {
      const data = res?.data ?? res;
      if (!(data instanceof Blob)) {
        toast({ title: 'Export failed', description: 'Server returned invalid data format' });
        return;
      }

      if (data.size === 0) {
        toast({ title: 'No data found', description: 'Try adjusting your date filters.' });
        return;
      }

      const blobObj = data;
      const url = URL.createObjectURL(blobObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Export ready', description: 'Download started successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Export failed', description: err.response?.data?.message || String(err), variant: 'destructive' });
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Data Exports</h2>
        <p className="text-muted-foreground">
          Generate and download system data for backups or reporting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Wizard</CardTitle>
          <CardDescription>
            Select data type, format, and optional date range to generate a report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">

            <div className="space-y-2">
              <Label>1. Data Type</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>2. Format</Label>
              <div className="flex gap-2">
                <Button
                  variant={format === 'csv' ? 'default' : 'outline'}
                  onClick={() => setFormat('csv')}
                  className="flex-1"
                  type="button"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button
                  variant={format === 'json' ? 'default' : 'outline'}
                  onClick={() => setFormat('json')}
                  className="flex-1"
                  type="button"
                >
                  <FileJson className="mr-2 h-4 w-4" /> JSON
                </Button>
                <Button
                  variant={format === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setFormat('pdf')}
                  className="flex-1"
                  type="button"
                >
                  <FileDown className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Date (Optional)</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={() => downloadMutation.mutate()}
              disabled={downloadMutation.isLoading}
              size="lg"
            >
              {downloadMutation.isLoading ? (
                <>Preparing...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download Export
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3 text-sm text-muted-foreground">
        <FileDown className="h-5 w-5 mt-0.5 text-primary" />
        <div>
          <p className="font-medium text-foreground">Backup Recommendation</p>
          <p>For full system backups, we recommend exporting <strong>Users</strong> and <strong>Events</strong> in <strong>JSON</strong> format to preserve data structure. CSV format is best for spreadsheet analysis.</p>
        </div>
      </div>

    </div>
  );
}
