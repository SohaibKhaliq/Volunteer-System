import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/atoms/use-toast';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { Database, FileArchive, Download, HardDrive, Server } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminBackup() {

  const downloadDatabaseMutation = useMutation({
    mutationFn: () => api.downloadDatabaseBackup(),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;
      if (!(data instanceof Blob)) return;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `db-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Database backup downloaded' });
    },
    onError: () => toast({ title: 'Backup failed', variant: 'destructive' })
  });

  const downloadMediaMutation = useMutation({
    mutationFn: () => api.downloadMediaBackup(),
    onSuccess: (res: any) => {
      const data = res?.data ?? res;
      if (!(data instanceof Blob)) return;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Media backup downloaded' });
    },
    onError: () => toast({ title: 'Backup failed', variant: 'destructive' })
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Full System Backup</h2>
        <p className="text-muted-foreground">
          Download complete copies of your system data and files for safe keeping.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Database Backup Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle>Database Dump</CardTitle>
            <CardDescription>
              Complete export of all system tables including Users, Events, Shifts, and more in JSON format.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-6">
            <div className="bg-muted p-3 rounded-md mb-6 text-sm flex gap-3">
              <Server className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">Includes:</p>
                <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                  <li>All User Profiles & Roles</li>
                  <li>Organizations & Members</li>
                  <li>Events, Shifts & Opportunities</li>
                  <li>Hours, Attendances & Applications</li>
                </ul>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => downloadDatabaseMutation.mutate()}
              disabled={downloadDatabaseMutation.isLoading}
            >
              {downloadDatabaseMutation.isLoading ? (
                'Generating Dump...'
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download Database.json
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Media Backup Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileArchive className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle>Media Files Archive</CardTitle>
            <CardDescription>
              Compressed ZIP archive containing all user uploads, documents, and event images.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-6">
            <div className="bg-muted p-3 rounded-md mb-6 text-sm flex gap-3">
              <HardDrive className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">Details:</p>
                <p className="text-xs text-muted-foreground">
                  Archives the entire <code>/uploads</code> directory. Depending on your storage size, this operation might take a few moments.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20"
              size="lg"
              onClick={() => downloadMediaMutation.mutate()}
              disabled={downloadMediaMutation.isLoading}
            >
              {downloadMediaMutation.isLoading ? (
                'Compressing Files...'
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download Media.zip
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Server className="h-4 w-4" />
        <AlertTitle>Off-site Backup Recommended</AlertTitle>
        <AlertDescription>
          It is recommended to store these backups on a separate physical drive or cloud storage provider.
        </AlertDescription>
      </Alert>

    </div>
  );
}
