import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function RosteringTable() {
  const queryClient = useQueryClient()

  // Fetch real volunteers associated with the logged-in organization
  const { data: volunteers } = useQuery({
      queryKey: ['org-volunteers'],
      queryFn: async () => {
          const res = await api.get('/organization-volunteers')
          return res.data
      }
  })

  const updateStatusMutation = useMutation({
      mutationFn: async ({ id, status }: { id: number, status: string }) => {
          await api.patch(\`/organization-volunteers/\${id}/status\`, { status })
      },
      onSuccess: (_, variables) => {
          toast.success(\`Volunteer \${variables.status}\`)
          queryClient.invalidateQueries(['org-volunteers'])
      }
  })

  const handleStatusUpdate = (id: number, status: 'approved' | 'rejected') => {
      updateStatusMutation.mutate({ id, status })
  }

  const list = Array.isArray(volunteers) ? volunteers : []

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Volunteer</TableHead>
            <TableHead>Reliability</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 && (
              <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No volunteers found.</TableCell>
              </TableRow>
          )}
          {list.map((v: any) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                    {v.rating || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>{v.hours || 0} hrs</TableCell>
              <TableCell>{v.status}</TableCell>
              <TableCell className="text-right">
                {v.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={() => handleStatusUpdate(v.id, 'approved')}
                            size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => handleStatusUpdate(v.id, 'rejected')}
                            size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
