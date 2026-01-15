import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { safeFormatDate } from '@/lib/format-utils';
import LoadingSpinner from '@/components/atoms/loading-spinner';

const ContactSubmissions = () => {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['contact-submissions'],
    queryFn: () => api.getContactSubmissions()
  });

  const submissions = data?.data?.data || data?.data || [];


  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('Contact Submissions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>{t('Name')}</TableHead>
                <TableHead>{t('Email')}</TableHead>
                <TableHead>{t('Subject')}</TableHead>
                <TableHead>{t('Message')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    {t('No submissions found')}
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {safeFormatDate(item.created_at || item.createdAt, 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {item.firstName} {item.lastName}
                    </TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.subject}</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.message}>
                      {item.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'unread' ? 'destructive' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactSubmissions;
