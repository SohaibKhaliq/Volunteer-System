import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Building2, User, ChevronLeft, CheckCircle, AlertCircle, Share2, Info } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [applyNotes, setApplyNotes] = useState('')
  const [isApplyOpen, setIsApplyOpen] = useState(false)

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const res = await api.get(`/volunteer/opportunities/${id}`)
      return res.data
    },
    enabled: !!id
  })

  const applyMutation = useMutation({
    mutationFn: async (vars: { notes?: string }) => {
      return api.post(`/volunteer/opportunities/${id}/apply`, vars)
    },
    onSuccess: () => {
      toast.success('Applied successfully!')
      setIsApplyOpen(false)
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to apply.')
    }
  })

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/volunteer/opportunities/${id}/withdraw`, {})
    },
    onSuccess: () => {
      toast.success('Withdrawn successfully.')
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
    },
    onError: (err: any) => {
      toast.error('Failed to withdraw.')
    }
  })

  if (isLoading) return <div className="p-8">Loading details...</div>
  if (!opportunity) return <div className="p-8">Opportunity not found.</div>

  const status = opportunity.userApplicationStatus // 'applied', 'accepted', 'waitlisted', 'withdrawn', null
  const isFull = opportunity.capacity > 0 && opportunity.application_count >= opportunity.capacity
  // NOTE: Logic for 'isFull' depends on how backend exposes counts. 
  // Opportunity.application_count from controller is raw applied count.
  // Ideally backend tells us if it accepts more. 
  // But based on controller logic: we check accepted count on apply.

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
       <Button variant="ghost" className="pl-0 gap-2" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4" /> Back to Opportunities
       </Button>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
             <div>
                <div className="flex items-center gap-2 mb-2">
                   <Badge variant="outline" className="capitalize">{opportunity.type || 'Event'}</Badge>
                   {opportunity.visibility === 'invite-only' && <Badge variant="secondary">Invite Only</Badge>}
                </div>
                <h1 className="text-3xl font-bold">{opportunity.title}</h1>
                <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> {opportunity.organization?.name}
                </p>
             </div>

             <Card>
                <CardHeader>
                    <CardTitle>About this opportunity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{opportunity.description}</p>
                    </div>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Requirements & Skills</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Render skills if available */}
                    {opportunity.skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {opportunity.skills.map((skill: string) => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No specific skills listed.</p>
                    )}
                </CardContent>
             </Card>
          </div>

          {/* Sidebar / Actions */}
          <div className="space-y-6">
              <Card className="sticky top-6">
                 <CardContent className="pt-6 space-y-6">
                     <div className="space-y-4">
                        <div className="flex items-start gap-3">
                             <Calendar className="w-5 h-5 text-primary mt-0.5" />
                             <div>
                                 <p className="font-medium">Date</p>
                                 <p className="text-sm text-muted-foreground">
                                     {format(new Date(opportunity.startAt), 'EEEE, MMMM do, yyyy')}
                                 </p>
                             </div>
                        </div>
                        <div className="flex items-start gap-3">
                             <Clock className="w-5 h-5 text-primary mt-0.5" />
                             <div>
                                 <p className="font-medium">Time</p>
                                 <p className="text-sm text-muted-foreground">
                                     {format(new Date(opportunity.startAt), 'p')} - {opportunity.endAt ? format(new Date(opportunity.endAt), 'p') : 'End of day'}
                                 </p>
                             </div>
                        </div>
                        <div className="flex items-start gap-3">
                             <MapPin className="w-5 h-5 text-primary mt-0.5" />
                             <div>
                                 <p className="font-medium">Location</p>
                                 <p className="text-sm text-muted-foreground">
                                     {opportunity.location || 'Online / Remote'}
                                 </p>
                             </div>
                        </div>
                        <div className="flex items-start gap-3">
                             <User className="w-5 h-5 text-primary mt-0.5" />
                             <div>
                                 <p className="font-medium">Capacity</p>
                                 <div className="text-sm text-muted-foreground">
                                     {opportunity.capacity > 0 ? (
                                         <span>{opportunity.capacity} spots available</span>
                                     ) : (
                                         <span>Open capacity</span>
                                     )}
                                 </div>
                             </div>
                        </div>
                     </div>

                     <Separator />

                     {/* Action Button Logic */}
                     <div>
                        {/* If applied/accepted/waitlisted */}
                        {status && status !== 'withdrawn' ? (
                            <div className="space-y-3">
                                <div className={`p-4 rounded-md border flex items-center gap-3 ${
                                    status === 'accepted' ? 'bg-green-50 border-green-200 text-green-800' :
                                    status === 'waitlisted' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                                    'bg-blue-50 border-blue-200 text-blue-800'
                                }`}>
                                   {status === 'accepted' && <CheckCircle className="w-5 h-5" />}
                                   {status === 'waitlisted' && <Clock className="w-5 h-5" />}
                                   {status === 'applied' && <Info className="w-5 h-5" />}
                                   
                                   <div className="font-medium capitalize">
                                      Status: {status}
                                   </div>
                                </div>
                                
                                {status !== 'accepted' && ( // Can't easily withdraw if accepted without contact? Or allowed? Let's allow for now.
                                    <Button 
                                        variant="outline" 
                                        className="w-full text-destructive hover:text-destructive"
                                        onClick={() => withdrawMutation.mutate()}
                                        disabled={withdrawMutation.isPending}
                                    >
                                        {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Application'}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full" size="lg">Apply Now</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Apply for {opportunity.title}</DialogTitle>
                                        <DialogDescription>
                                            Share any notes or specific skills you bring to this event.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <label className="text-sm font-medium mb-1.5 block">Notes (Optional)</label>
                                        <Textarea 
                                            placeholder="I have experience with..." 
                                            value={applyNotes}
                                            onChange={(e) => setApplyNotes(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsApplyOpen(false)}>Cancel</Button>
                                        <Button onClick={() => applyMutation.mutate({ notes: applyNotes })} disabled={applyMutation.isPending}>
                                            {applyMutation.isPending ? 'Submitting...' : 'Confirm Application'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                     </div>

                 </CardContent>
              </Card>
          </div>
       </div>
    </div>
  )
}
