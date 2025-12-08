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
import { useState } from "react"

// Mock Data Initial State (In real app, fetch via useQuery)
const INITIAL_VOLUNTEERS = [
  { id: 1, name: "Alice Johnson", status: "Applied", reliability: "High", hours: 120 },
  { id: 2, name: "Bob Smith", status: "Approved", reliability: "Medium", hours: 45 },
  { id: 3, name: "Charlie Brown", status: "Applied", reliability: "Low", hours: 5 },
]

export function RosteringTable() {
  const [volunteers, setVolunteers] = useState(INITIAL_VOLUNTEERS)

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
      try {
          // Optimistic UI Update
          setVolunteers(prev => prev.map(v => v.id === id ? { ...v, status: status === 'approved' ? 'Approved' : 'Rejected' } : v))

          await api.patch(\`/organization-volunteers/\${id}/status\`, { status })
          toast.success(\`Volunteer \${status}\`)
      } catch (e) {
          toast.error("Failed to update status")
          // Revert on failure would go here
      }
  }

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
          {volunteers.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.name}</TableCell>
              <TableCell>
                <Badge variant={v.reliability === 'High' ? 'default' : v.reliability === 'Low' ? 'destructive' : 'secondary'}>
                    {v.reliability}
                </Badge>
              </TableCell>
              <TableCell>{v.hours} hrs</TableCell>
              <TableCell>{v.status}</TableCell>
              <TableCell className="text-right">
                {v.status === 'Applied' && (
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
