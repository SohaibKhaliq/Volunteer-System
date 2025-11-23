// src/pages/admin/certifications.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, Clock, XCircle } from "lucide-react";

// Mock data for training courses
const mockCourses = [
  { id: 1, name: "First Aid", participants: 45, completed: 30 },
  { id: 2, name: "Child Safeguarding", participants: 60, completed: 55 },
  { id: 3, name: "Volunteer Management", participants: 40, completed: 20 },
];

// Mock data for volunteer certifications
const mockCerts = [
  { id: 1, volunteer: "Alice", type: "WWCC", expires: "2025-12-01", status: "Valid" },
  { id: 2, volunteer: "Bob", type: "Police Check", expires: "2025-10-15", status: "Expiring" },
  { id: 3, volunteer: "Carol", type: "First Aid", expires: "2024-08-20", status: "Expired" },
];

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
                      variant={
                        c.status === "Valid"
                          ? "default"
                          : c.status === "Expiring"
                          ? "secondary"
                          : "destructive"
                      }
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
