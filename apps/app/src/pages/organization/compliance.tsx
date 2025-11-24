import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShieldCheck, 
  FileText, 
  Upload, 
  AlertCircle, 
  Download
} from 'lucide-react';

export default function OrganizationCompliance() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const documents = [
    {
      id: 1,
      name: 'Non-Profit Registration',
      type: 'License',
      status: 'Valid',
      expiry: '2026-12-31',
      lastUpdated: '2024-01-15'
    },
    {
      id: 2,
      name: 'Liability Insurance',
      type: 'Insurance',
      status: 'Expiring Soon',
      expiry: '2025-06-30',
      lastUpdated: '2024-06-30'
    },
    {
      id: 3,
      name: 'Safety Protocol Guidelines',
      type: 'Policy',
      status: 'Valid',
      expiry: 'N/A',
      lastUpdated: '2024-03-10'
    }
  ];

  const volunteerCompliance = [
    { id: 1, requirement: 'Background Check', total: 124, compliant: 118, pending: 6 },
    { id: 2, requirement: 'Code of Conduct', total: 124, compliant: 124, pending: 0 },
    { id: 3, requirement: 'Safety Training', total: 124, compliant: 98, pending: 26 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance</h2>
          <p className="text-muted-foreground">Manage licenses, certifications, and regulatory requirements.</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Compliance Document</DialogTitle>
              <DialogDescription>
                Upload a new license, certification, or policy document.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="doc-name">Document Name</Label>
                <Input id="doc-name" placeholder="e.g. 2025 Business License" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-type">Document Type</Label>
                <Input id="doc-type" placeholder="e.g. License, Insurance" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date (if applicable)</Label>
                <Input id="expiry" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsUploadOpen(false)}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Overall Status</p>
              <h3 className="text-2xl font-bold text-green-700">Compliant</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Active Documents</p>
              <h3 className="text-2xl font-bold text-blue-700">12</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-600">Action Required</p>
              <h3 className="text-2xl font-bold text-orange-700">1 Item</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Documents</CardTitle>
            <CardDescription>Official licenses and certifications.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">{doc.type}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={doc.status === 'Valid' ? 'outline' : 'destructive'}
                        className={doc.status === 'Valid' ? 'text-green-600 border-green-200 bg-green-50' : ''}
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.expiry}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volunteer Compliance</CardTitle>
            <CardDescription>Tracking volunteer requirements.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {volunteerCompliance.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.requirement}</span>
                    <span className="text-muted-foreground">{item.compliant}/{item.total} Compliant</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${item.pending > 0 ? 'bg-orange-500' : 'bg-green-500'}`} 
                      style={{ width: `${(item.compliant / item.total) * 100}%` }}
                    ></div>
                  </div>
                  {item.pending > 0 && (
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {item.pending} volunteers pending verification
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
