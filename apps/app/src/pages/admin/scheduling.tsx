// src/pages/admin/scheduling.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

// Mock shift data
const mockShifts = [
  { id: 1, date: "2025-11-20", time: "09:00 - 13:00", role: "Food Distribution", volunteers: 5 },
  { id: 2, date: "2025-11-22", time: "14:00 - 18:00", role: "Community Cleanup", volunteers: 8 },
  { id: 3, date: "2025-11-25", time: "10:00 - 12:00", role: "Medical Aid", volunteers: 3 },
];

export default function AdminScheduling() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Volunteers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockShifts.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.date}</TableCell>
                  <TableCell>{s.time}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell>{s.volunteers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
