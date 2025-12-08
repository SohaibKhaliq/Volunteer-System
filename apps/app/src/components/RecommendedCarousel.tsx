import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Star, MapPin, Calendar, ArrowRight } from "lucide-react"

interface Opportunity {
  id: number
  title: string
  description: string
  organizationName?: string // Assuming serialized
  matchScore?: number
  aiReasoning?: string
  location?: string
  date?: string
}

export function RecommendedCarousel() {
  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ['recommended-opportunities'],
    queryFn: async () => {
      const res = await api.get('/discovery/recommended')
      return res.data
    }
  })

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Loading AI Recommendations...</div>
  }

  if (!opportunities || opportunities.length === 0) {
    return <div className="text-center text-muted-foreground">No recommendations found yet. Update your profile!</div>
  }

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Recommended for You ✨</h2>
        <Button variant="ghost" className="text-sm">View All</Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex w-max space-x-4 p-4">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="w-[300px] shrink-0">
              <CardHeader>
                <div className="flex justify-between items-start">
                   <Badge variant="secondary" className="mb-2">{(opp.matchScore || 0 * 100).toFixed(0)}% Match</Badge>
                </div>
                <CardTitle className="truncate">{opp.title}</CardTitle>
                <CardDescription className="truncate">{opp.organizationName || 'Community Org'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{opp.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{opp.date || 'Flexible'}</span>
                    </div>
                    {opp.aiReasoning && (
                        <div className="mt-2 text-xs bg-blue-50 text-blue-700 p-2 rounded flex items-start gap-1 whitespace-normal">
                             <Star className="w-3 h-3 mt-0.5 shrink-0" />
                             {opp.aiReasoning}
                        </div>
                    )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">View Details <ArrowRight className="ml-2 w-4 h-4" /></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
