import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import SkeletonCard from '@/components/atoms/skeleton-card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: ['notifications'], queryFn: api.listNotifications });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <SkeletonCard />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No notifications
                  </TableCell>
                </TableRow>
              ) : (
                items.map((n: any) => (
                  <TableRow key={n.id}>
                    <TableCell>{new Date(n.createdAt || n.created_at).toLocaleString()}</TableCell>
                    <TableCell>{n.type}</TableCell>
                    <TableCell>
                      {n.payload && typeof n.payload === 'object' ? JSON.stringify(n.payload) : n.payload}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <Button
                            size="sm"
                            onClick={() => markReadMutation.mutate(n.id)}
                            aria-label={`Mark ${n.id} read`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
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
