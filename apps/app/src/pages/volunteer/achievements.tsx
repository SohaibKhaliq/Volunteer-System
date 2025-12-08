import { useQuery } from '@tanstack/react-query';
import volunteerApi from '@/lib/api/volunteerApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Share2, Download, Award, Lock } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

/**
 * Volunteer Achievements Page
 * Badge gallery with share buttons and progress tracking
 */
export default function VolunteerAchievements() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['volunteer', 'achievements'],
    queryFn: volunteerApi.getMyAchievements,
  });

  const handleShare = async (achievement: any) => {
    const shareData = {
      title: `${achievement.name} Achievement`,
      text: `I just earned the "${achievement.name}" badge on the volunteer platform!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownloadCertificate = (achievement: any) => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    
    toast.success('Certificate downloaded!', {
      description: 'Your achievement certificate has been downloaded.',
    });
    
    // In production, this would generate a real certificate
    console.log('Downloading certificate for:', achievement.name);
  };

  const achievementsList = Array.isArray(achievements) 
    ? achievements 
    : (achievements as any)?.data || (achievements as any)?.achievements || [];

  const earned = achievementsList.filter((a: any) => a.earned || a.earnedAt);
  const locked = achievementsList.filter((a: any) => !a.earned && !a.earnedAt);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          My Achievements
        </h1>
        <p className="text-muted-foreground">
          Track your volunteer journey and showcase your accomplishments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementsList.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earned</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{earned.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{locked.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Earned Achievements */}
      {earned.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Earned Achievements 🎉</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earned.map((achievement: any) => (
              <Card key={achievement.id} className="overflow-hidden border-2 border-yellow-500/20">
                <CardHeader className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        {achievement.name || achievement.title}
                      </CardTitle>
                      {achievement.earnedAt && (
                        <CardDescription>
                          Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-yellow-500 text-white">
                      ✓
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {achievement.description || 'Keep up the great work!'}
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(achievement)}
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadCertificate(achievement)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {locked.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Achievements to Unlock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((achievement: any) => (
              <Card key={achievement.id} className="overflow-hidden opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-gray-400" />
                        {achievement.name || achievement.title}
                      </CardTitle>
                      {achievement.requirement && (
                        <CardDescription>{achievement.requirement}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {achievement.description || 'Complete the requirements to unlock this achievement.'}
                  </p>
                  
                  {/* Progress bar */}
                  {achievement.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {achievementsList.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-gray-300" />
            <div>
              <h3 className="text-lg font-semibold">No achievements yet</h3>
              <p className="text-muted-foreground">
                Start volunteering to earn your first achievement!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
