import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Users, Building2 } from "lucide-react"
import { OrgApprovalTable } from "./OrgApprovalTable"
import { GlobalSettings } from "./GlobalSettings"

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard')
      return res.data
    }
  })

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Admin Control Tower</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.organizations?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.organizations?.pending || 0} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.users?.active || 0} active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
           <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
           <CardContent>
              <OrgApprovalTable />
           </CardContent>
        </Card>
        <Card className="col-span-1">
           <CardHeader><CardTitle>Global Settings</CardTitle></CardHeader>
           <CardContent>
              <GlobalSettings />
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
