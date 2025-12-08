import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { CreateEventForm } from "./CreateEventForm"
import { RosteringTable } from "@/components/RosteringTable"

export function OrgDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['org-stats'],
    queryFn: async () => {
        // Mock stats endpoint or reuse existing reports
        // For prototype, using a mock return as we focused on admin stats earlier
        return {
            activeEvents: 3,
            pendingApplications: 12
        }
    }
  })

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Organization Command Center</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent>
             <CreateEventForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
             <Card>
                <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{stats?.activeEvents}</div>
                            <div className="text-xs text-muted-foreground">Active Events</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{stats?.pendingApplications}</div>
                            <div className="text-xs text-muted-foreground">Pending Apps</div>
                        </div>
                    </div>
                </CardContent>
             </Card>

             <Card>
                <CardHeader><CardTitle>Rostering</CardTitle></CardHeader>
                <CardContent>
                    <RosteringTable />
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  )
}
