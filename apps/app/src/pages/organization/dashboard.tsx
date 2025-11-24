
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function OrganizationDashboard() {
  // Mock data for dashboard
  const stats = [
    {
      title: 'Active Volunteers',
      value: '124',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Upcoming Events',
      value: '8',
      change: 'Next: Tomorrow',
      trend: 'neutral',
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'Total Hours',
      value: '1,248',
      change: '+54 this month',
      trend: 'up',
      icon: Clock,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Compliance Rate',
      value: '94%',
      change: '2 pending review',
      trend: 'down',
      icon: CheckCircle2,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'Sarah Ahmed',
      action: 'registered for',
      target: 'Beach Cleanup Drive',
      time: '2 hours ago',
      initials: 'SA'
    },
    {
      id: 2,
      user: 'Mohammed Ali',
      action: 'completed task',
      target: 'Food Distribution Logistics',
      time: '4 hours ago',
      initials: 'MA'
    },
    {
      id: 3,
      user: 'System',
      action: 'alert',
      target: 'License renewal due in 5 days',
      time: '1 day ago',
      initials: 'SYS',
      isAlert: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  {stat.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (Placeholder) */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Volunteer Engagement</CardTitle>
            <CardDescription>Weekly participation overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <div className="text-center">
                <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">Engagement Chart Visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${activity.isAlert ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {activity.isAlert ? <AlertCircle className="h-5 w-5" /> : activity.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Create Event</h3>
              <p className="text-blue-100 text-sm mb-4">Schedule a new volunteer activity</p>
              <Button size="sm" variant="secondary" className="text-blue-600">
                Create Now
              </Button>
            </div>
            <Calendar className="h-12 w-12 text-blue-200 opacity-50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Verify Hours</h3>
              <p className="text-purple-100 text-sm mb-4">12 pending hour logs</p>
              <Button size="sm" variant="secondary" className="text-purple-600">
                Review Logs
              </Button>
            </div>
            <Clock className="h-12 w-12 text-purple-200 opacity-50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Invite Volunteers</h3>
              <p className="text-green-100 text-sm mb-4">Grow your impact team</p>
              <Button size="sm" variant="secondary" className="text-green-600">
                Send Invites
              </Button>
            </div>
            <Users className="h-12 w-12 text-green-200 opacity-50" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
