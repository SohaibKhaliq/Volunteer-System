import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus } from 'lucide-react';

export default function OrganizationResources() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: resourcesRaw, isLoading } = useQuery({
    queryKey: ['org-resources', search],
    queryFn: async () => api.listMyOrganizationResources({ search })
  });

  const resources: any[] = Array.isArray(resourcesRaw)
    ? resourcesRaw
    : resourcesRaw && Array.isArray((resourcesRaw as any).data)
      ? (resourcesRaw as any).data
      : resourcesRaw && Array.isArray((resourcesRaw as any).resources)
        ? (resourcesRaw as any).resources
        : [];

  const filtered = resources.filter((r: any) =>
    search ? `${r.name}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search resources"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <div className="ml-auto">
              <Button asChild>
                <a href="/organization/resources/new">
                  <Plus className="h-4 w-4 mr-2" /> New Resource
                </a>
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No resources found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      {r.quantityAvailable ?? r.quantity_available ?? 0}/{r.quantityTotal ?? r.quantity_total ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'available'
                            ? 'default'
                            : r.status === 'maintenance'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild size="sm">
                          <a href={`/organization/resources/${r.id}`}>View</a>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <a href={`/organization/resources/${r.id}/edit`}>Edit</a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
