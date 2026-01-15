import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
// Progress UI intentionally removed; relying on backend status/fields
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/atoms/use-toast';

export default function VolunteerTraining() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: modules = [], isLoading } = useQuery(['my-training'], () => api.listVolunteerTraining());

  const startMutation = useMutation({
    mutationFn: (id: number) => api.startVolunteerTraining(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-training'] });
      toast({ title: t('Started'), description: t('Training started') });
    },
    onError: () => toast({ title: t('Error'), description: t('Could not start training'), variant: 'destructive' })
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, score }: { id: number; score: number }) => api.completeVolunteerTraining(id, { score }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-training'] });
      toast({ title: t('Completed'), description: t('Training completed') });
    },
    onError: () => toast({ title: t('Error'), description: t('Could not complete training'), variant: 'destructive' })
  });

  const handleStart = (id: number) => {
    startMutation.mutate(id);
  };

  const handleComplete = async (id: number) => {
    const confirmed = window.confirm(t('Mark this module as completed?'));
    if (!confirmed) return;
    // For now, assume full score; later prompt for real score if needed
    completeMutation.mutate({ id, score: 100 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('My Training')}</h2>
          <p className="text-muted-foreground">{t('Access assigned training modules and track progress.')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Array.isArray(modules) ? modules : (modules?.data ?? [])).map((m: any) => (
          <Card key={m.id} className="group border-border/50 rounded-[1rem] hover:shadow-2xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{m.module?.title || m.title}</span>
                <Badge
                  variant={m.status === 'completed' ? 'default' : 'secondary'}
                  className="text-[10px] uppercase font-black"
                >
                  {String(m.status || '').replace('_', ' ') || 'Not started'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t('Status')}</div>
                <div className="font-medium">{String(m.status || 'not_started').replace('_', ' ')}</div>
                {m.progress != null && (
                  <div className="text-xs text-muted-foreground">
                    {t('Progress:')} {m.progress}%
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {m.status === 'not_started' && (
                  <Button onClick={() => handleStart(m.id)} disabled={startMutation.isLoading} className="flex-1">
                    {startMutation.isLoading ? t('Starting...') : t('Start')}
                  </Button>
                )}

                {m.status === 'in_progress' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/training/${m.moduleId || m.id}`)}
                      className="flex-1"
                    >
                      {t('Continue')}
                    </Button>
                    <Button onClick={() => handleComplete(m.id)} disabled={completeMutation.isLoading}>
                      {completeMutation.isLoading ? t('Completing...') : t('Complete')}
                    </Button>
                  </>
                )}

                {m.status === 'completed' && (
                  <Button onClick={() => navigate(`/training/${m.moduleId || m.id}`)} className="flex-1">
                    {t('Review')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!modules ||
          (Array.isArray(modules) && modules.length === 0) ||
          (modules?.data && modules.data.length === 0)) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <div className="mb-4 text-lg font-bold">{t('No training modules assigned')}</div>
            <div>{t('Ask your organization administrators to assign the required training modules.')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
