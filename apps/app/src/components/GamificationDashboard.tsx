import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Trophy, Award } from "lucide-react"

export function GamificationDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: async () => {
        const res = await api.get('/volunteer/gamification/stats')
        return res.data
    }
  })

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Level</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Lvl {stats.level}</div>
          <Progress value={(stats.currentXp / stats.nextLevelXp) * 100} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.currentXp} / {stats.nextLevelXp} XP to next level
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Badges</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex gap-4">
                {stats.badges.map((badge: any) => (
                    <div key={badge.id} className="flex flex-col items-center p-2 bg-secondary rounded-lg">
                        <span className="text-2xl">{badge.icon}</span>
                        <span className="text-xs font-semibold mt-1">{badge.name}</span>
                    </div>
                ))}
                {stats.badges.length === 0 && <span className="text-sm text-muted-foreground">No badges yet. Start volunteering!</span>}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
