import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, AlertCircle, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { toast } from '@/components/atoms/use-toast';

const IMPORT_TYPES = [
  { value: 'users', label: 'Users & Volunteers' },
  { value: 'events', label: 'Events' },
  { value: 'shifts', label: 'Shifts' },
];

export default function AdminImports() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('users');
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Fetch scheduled/history jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: () => api.listScheduledJobs()
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.getImportTemplate(selectedType);
      const data = res?.data ?? res;
      const blob = data instanceof Blob ? data : new Blob([JSON.stringify(data)], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}_template.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError: (err: any) => {
      toast({ title: 'Template download failed', description: String(err), variant: 'destructive' });
    }
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      return api.processGenericImport(file, selectedType);
    },
    onSuccess: (res: any) => {
      const data = res?.data ?? res;
      setImportResult(data);
      toast({ title: 'Import processed', description: data.message });
      setFile(null); // Clear file after success
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] }); // If imports create jobs
    },
    onError: (err: any) => {
      toast({ title: 'Import failed', description: err.response?.data?.message || String(err), variant: 'destructive' });
      setImportResult({ error: err.response?.data?.message || String(err) });
    }
  });

  const retryJobMutation = useMutation({
    mutationFn: (jobId: number) => api.retryScheduledJob(jobId),
    onSuccess: () => {
      toast({ title: 'Job retry requested' });
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
    }
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Data Imports</h2>
        <p className="text-muted-foreground">
          Bulk import data into the system using CSV templates.
        </p>
      </div>

      <Tabs defaultValue="new-import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="new-import">New Import</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="new-import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Wizard</CardTitle>
              <CardDescription>
                Select the type of data you wish to import, download the template, and upload your CSV file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Step 1: Select Type */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>1. Select Data Type</Label>
                  <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setImportResult(null); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPORT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>2. Get Template</Label>
                  <div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => downloadTemplateMutation.mutate()}
                      disabled={downloadTemplateMutation.isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download {selectedType} CSV Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Upload */}
              <div className="space-y-2">
                <Label>3. Upload CSV File</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    type="file"
                    accept=".csv"
                    className="cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    onClick={() => importMutation.mutate()}
                    disabled={!file || importMutation.isLoading}
                  >
                    {importMutation.isLoading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Start Import
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ensure your active file matches the template headers exactly.
                </p>
              </div>

              {/* Results Area */}
              {importResult && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-4">
                  {importResult.error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Failed</AlertTitle>
                      <AlertDescription>{importResult.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/10">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-600">Import Successful</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 text-sm">
                          <p><strong>{importResult.results?.imported ?? 0}</strong> records imported successfully.</p>
                          <p><strong>{importResult.results?.skipped ?? 0}</strong> records skipped/failed.</p>

                          {importResult.results?.errors?.length > 0 && (
                            <div className="mt-4 p-4 bg-white dark:bg-slate-950 rounded border">
                              <p className="font-medium mb-2 text-red-600">Error Details:</p>
                              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground max-h-40 overflow-y-auto">
                                {importResult.results.errors.map((err: string, i: number) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Import Jobs</CardTitle>
              <CardDescription>Monitor status of background import tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading history...</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  No generic import jobs found in history.
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job: any) => (
                    <div key={job.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{job.name}</span>
                          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Type: {job.type} • Run at: {new Date(job.runAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        {job.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryJobMutation.mutate(job.id)}
                            disabled={retryJobMutation.isLoading}
                          >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Retry Job
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
