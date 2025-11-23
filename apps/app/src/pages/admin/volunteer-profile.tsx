// src/pages/admin/volunteer-profile.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Clock, Award } from 'lucide-react';
import { volunteerProfile } from '@/lib/mock/adminMock';

export default function AdminVolunteerProfile() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <User className="h-16 w-16 text-blue-600 mb-2" />
          <CardTitle className="text-2xl font-bold">{volunteerProfile.name}</CardTitle>
          <p className="text-sm text-gray-600">{volunteerProfile.role}</p>
          <p className="mt-2 text-lg font-medium">{volunteerProfile.hours} hrs volunteered</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 justify-center">
          {volunteerProfile.certifications.map((c, i) => (
            <Badge key={i} variant="default" className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              {c}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
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
              {volunteerProfile.activity.map((a) => (
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
