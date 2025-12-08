import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { toast } from "sonner"
import { Check } from "lucide-react"

export function OrgApprovalTable() {
  const queryClient = useQueryClient()
  const { data: orgs } = useQuery({
    queryKey: ['admin-orgs-pending'],
    queryFn: async () => {
      const res = await api.get('/admin/organizations', { params: { status: 'pending' } })
      return res.data.data // Pagination wrapper
    }
  })

  const approveMutation = useMutation({
      mutationFn: async (id: number) => {
          await api.post(\`/admin/organizations/\${id}/approve\`)
      },
      onSuccess: () => {
          toast.success("Organization approved")
          queryClient.invalidateQueries(['admin-orgs-pending'])
          queryClient.invalidateQueries(['admin-dashboard'])
      }
  })

  if (!orgs || orgs.length === 0) {
      return <div className="text-sm text-muted-foreground">No pending organizations.</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orgs.map((org: any) => (
            <TableRow key={org.id}>
              <TableCell className="font-medium">{org.name}</TableCell>
              <TableCell>{org.contactEmail || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => approveMutation.mutate(org.id)}>
                    <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
