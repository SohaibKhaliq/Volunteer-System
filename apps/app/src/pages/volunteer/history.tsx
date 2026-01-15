import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { safeFormatDate } from '@/lib/format-utils';

const VolunteerHistory = () => {
  const { t } = useTranslation();
  const { data: history, isLoading } = useQuery(['volunteer-hours'], () =>
    api.listHours().then((res: any) => res.data)
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('Volunteer History')}</h1>
        <p className="text-slate-600">{t('Track your contributions and hours.')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Activity Log')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Event / Activity')}</TableHead>
                <TableHead>{t('Organization')}</TableHead>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>{t('Hours')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.event?.title || 'Unknown Event'}</TableCell>
                  <TableCell>{item.event?.organization?.name || '-'}</TableCell>
                  <TableCell>{safeFormatDate(item.date)}</TableCell>
                  <TableCell>{item.hours}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>{item.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!history || history.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('No history found.')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerHistory;
