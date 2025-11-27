// src/pages/admin/volunteer-profile.tsx
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Clock, Award } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminVolunteerProfile() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const idParam = params.get('id');

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: api.getCurrentUser, enabled: !idParam });
  const { data: userById } = useQuery({
    queryKey: ['user', idParam],
    queryFn: () => api.getUser(Number(idParam)),
    enabled: !!idParam
  });

  const user = (userById && (userById as any).data) || currentUser || (userById as any) || (currentUser as any);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <User className="h-16 w-16 text-blue-600 mb-2" />
          <CardTitle className="text-2xl font-bold">
            {user?.firstName || user?.first_name || user?.email || 'Volunteer'}
          </CardTitle>
          <p className="text-sm text-gray-600">{user?.role || user?.roles?.map((r: any) => r.name).join(', ')}</p>
          <p className="mt-2 text-lg font-medium">{user?.hours || 0} hrs volunteered</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 justify-center">
          {(user?.certifications || []).map((c: any, i: number) => (
            <Badge key={i} variant="default" className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              {c}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(user?.activity || []).map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>{a.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
