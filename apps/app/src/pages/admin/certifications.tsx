// src/pages/admin/certifications.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';
import { courses as mockCourses, certs as mockCerts } from '@/lib/mock/adminMock';

// Using shared mock data from /src/lib/mock/adminMock.ts

export default function AdminCertifications() {
  return (
    <div className="space-y-6">
      {/* Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Training Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCourses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.participants}</TableCell>
                  <TableCell>{c.completed}</TableCell>
                  <TableCell>
                    <Badge variant="default">{Math.round((c.completed / c.participants) * 100)}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Volunteer Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volunteer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCerts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.volunteer}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.expires}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === 'Valid' ? 'default' : c.status === 'Expiring' ? 'secondary' : 'destructive'}
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
