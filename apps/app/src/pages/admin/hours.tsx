// src/pages/admin/hours.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle, XCircle } from "lucide-react";

// Mock hour entries
const mockHours = [
  { id: 1, volunteer: "Alice", event: "Food Drive", date: "2025-11-01", hours: 5, status: "Approved" },
  { id: 2, volunteer: "Bob", event: "Park Cleanup", date: "2025-11-03", hours: 3, status: "Pending" },
  { id: 3, volunteer: "Carol", event: "Community Outreach", date: "2025-11-05", hours: 4, status: "Rejected" },
];

export default function AdminHours() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Volunteer Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volunteer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHours.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.volunteer}</TableCell>
                  <TableCell>{h.event}</TableCell>
                  <TableCell>{h.date}</TableCell>
                  <TableCell>{h.hours}</TableCell>
                  <TableCell>
                    <Badge variant={
                      h.status === "Approved"
                        ? "default"
                        : h.status === "Pending"
                        ? "secondary"
                        : "destructive"
                    }>
                      {h.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk actions (mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Bulk Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Button variant="outline">Approve Selected</Button>
          <Button variant="outline" className="bg-destructive text-white hover:bg-destructive/90">
            <XCircle className="h-4 w-4 mr-2" />
            Reject Selected
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
