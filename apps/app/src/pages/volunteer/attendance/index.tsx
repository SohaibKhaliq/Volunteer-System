import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, CheckCircle, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ShiftAssignment {
  id: number
  status: string
  shift: {
    id: number
    title: string
    startAt: string
    endAt: string
    event?: {
        title: string
        location?: string
    }
  }
  checkedInAt?: string
  checkedOutAt?: string
  hours?: number
}

export default function MyAttendance() {
  const queryClient = useQueryClient()

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      // Assuming GET /attendance returns assignments
      const res = await api.get('/volunteer/attendance') 
      // If the API structure is different, we might need to adjust. 
      // Existing api.ts says getVolunteerAttendance calls /volunteer/attendance
      return res.data as ShiftAssignment[]
    }
  })

  const checkInMutation = useMutation({
    mutationFn: async (shiftId: number) => {
       // Using api.post directly to our new endpoint
       return api.post('/attendance/checkin', { shiftId })
    },
    onSuccess: () => {
      toast.success('Checked in successfully')
      queryClient.invalidateQueries(['my-attendance'])
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to check in')
    }
  })

  const checkOutMutation = useMutation({
    mutationFn: async (shiftId: number) => {
       return api.post('/attendance/checkout', { shiftId })
    },
    onSuccess: () => {
      toast.success('Checked out successfully')
      queryClient.invalidateQueries(['my-attendance'])
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to check out')
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center">Loading attendance...</div>
  }

  const upcoming = assignments?.filter(a => a.status !== 'completed' && !a.checkedOutAt) || []
  const history = assignments?.filter(a => a.status === 'completed' || a.checkedOutAt) || []

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Attendance</h1>
        <p className="text-muted-foreground">Manage your shift check-ins and view history.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Active & Upcoming Shifts</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground">No upcoming shifts assigned.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map(assignment => (
              <Card key={assignment.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                     <div>
                        <CardTitle className="text-lg">{assignment.shift.title}</CardTitle>
                        <div className="text-sm text-muted-foreground mt-1">
                           {assignment.shift.event?.title}
                        </div>
                     </div>
                     <Badge variant={assignment.checkedInAt ? "default" : "outline"}>
                        {assignment.checkedInAt ? "In Progress" : "Scheduled"}
                     </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(assignment.shift.startAt), 'EEEE, MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(assignment.shift.startAt), 'h:mm a')} - {format(new Date(assignment.shift.endAt), 'h:mm a')}
                    </div>
                    {assignment.shift.event?.location && (
                         <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {assignment.shift.event.location}
                        </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!assignment.checkedInAt ? (
                        <Button 
                            className="w-full" 
                            onClick={() => checkInMutation.mutate(assignment.shift.id)}
                            disabled={checkInMutation.isLoading}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Check In
                        </Button>
                    ) : (
                        <Button 
                            className="w-full" 
                            variant="secondary"
                            onClick={() => checkOutMutation.mutate(assignment.shift.id)}
                            disabled={checkOutMutation.isLoading}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Check Out
                        </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Attendance History</h2>
         {history.length === 0 ? (
          <p className="text-muted-foreground">No history available.</p>
        ) : (
            <div className="border rounded-md">
                <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b bg-muted/50">
                    <div className="col-span-2">Shift</div>
                    <div>Date</div>
                    <div>Hours</div>
                    <div>Status</div>
                </div>
                {history.map(assignment => (
                    <div key={assignment.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-0 items-center">
                         <div className="col-span-2">
                            <div className="font-medium">{assignment.shift.title}</div>
                            <div className="text-xs text-muted-foreground">{assignment.shift.event?.title}</div>
                         </div>
                         <div className="text-sm">
                            {format(new Date(assignment.shift.startAt), 'MMM d, yyyy')}
                         </div>
                         <div className="text-sm">
                             {assignment.hours ? `${assignment.hours} hrs` : '-'}
                         </div>
                         <div>
                             <Badge variant="secondary">Completed</Badge>
                         </div>
                    </div>
                ))}
            </div>
        )}
      </section>
    </div>
  )
}
