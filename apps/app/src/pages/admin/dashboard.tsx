// src/pages/admin/dashboard.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {BarChart3,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  // Mock data for demonstration
  const stats = {
    volunteers: 1247,
    events: 42,
    pendingTasks: 156,
    compliance: 94,
  };

  const activity = [
    { time: "2 min ago", desc: "New volunteer John Doe registered" },
    { time: "15 min ago", desc: "Event Community Clean‑up created" },
    { time: "1 h ago", desc: "Task Distribute flyers marked completed" },
    { time: "3 h ago", desc: "Compliance document WWCC expired for Jane" },
  ];

  const topVolunteers = [
    { name: "Alice", hours: 120 },
    { name: "Bob", hours: 98 },
    { name: "Carol", hours: 85 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <Badge variant="secondary">Live Demo</Badge>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <Users className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Volunteers</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.volunteers}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <Calendar className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Events</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.events}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <AlertTriangle className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Pending Tasks</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.pendingTasks}</CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <TrendingUp className="h-6 w-6 opacity-80" />
            <Badge variant="outline">Compliance</Badge>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.compliance}%</CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activity.map((a, i) => (
            <div key={i} className="flex justify-between text-sm text-muted-foreground">
              <span>{a.desc}</span>
              <span>{a.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Volunteers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Volunteers (Hours)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {topVolunteers.map((v, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-medium">
                {i + 1}
              </div>
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.hours} hrs</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}