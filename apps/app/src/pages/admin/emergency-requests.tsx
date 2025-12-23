import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import api from '@/lib/api';
import { HelpRequest } from '@/types/types';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MoreHorizontal, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// ... imports
import { RequestDetailsModal } from '@/components/organisms/RequestDetailsModal';
import { AssignVolunteerModal } from '@/components/organisms/AssignVolunteerModal';

const AdminEmergencyRequests = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // ... existing query ...
  const { data: requests, isLoading } = useQuery({
    queryKey: ['help-requests'],
    queryFn: () => api.listHelpRequests()
  });

  const filteredRequests = requests?.filter((req: HelpRequest) =>
    req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 hover:bg-red-600';
      case 'high': return 'bg-orange-500 hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-green-500 hover:bg-green-600';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('Emergency Requests')}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Active Requests')}</CardTitle>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search requests...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Case ID')}</TableHead>
                  <TableHead>{t('Urgency')}</TableHead>
                  <TableHead>{t('Severity')}</TableHead>
                  <TableHead>{t('Location')}</TableHead>
                  <TableHead>{t('Contact')}</TableHead>
                  <TableHead>{t('Assistance Type')}</TableHead>
                  <TableHead>{t('Submitted')}</TableHead>
                  <TableHead className="text-right">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {t('Loading...')}
                    </TableCell>
                  </TableRow>
                ) : filteredRequests?.length === 0 ? (
                  <TableRow>
                   <TableCell colSpan={8} className="h-24 text-center">
                     {t('No requests found.')}
                   </TableCell>
                 </TableRow>
                ) : (
                  filteredRequests?.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.caseId || request.case_id || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {request.urgencyScore ?? request.urgency_score ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(request.severity)}>
                          {request.severity?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.address}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{request.name}</span>
                          <span className="text-xs text-muted-foreground">{request.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.types?.map((t: any) => t.type).join(', ')}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          try {
                            const dateStr = request.createdAt || request.created_at;
                            return dateStr ? format(new Date(dateStr), 'MMM d, HH:mm') : 'N/A';
                          } catch (e) {
                            return 'Invalid Date';
                          }
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('Actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                                setSelectedRequest(request);
                                setDetailsModalOpen(true);
                            }}>
                              {t('View Details')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setSelectedRequest(request);
                                setAssignModalOpen(true);
                            }}>
                              {t('Assign Volunteer')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">{t('Close Case')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RequestDetailsModal 
        request={selectedRequest}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedRequest(null);
        }}
      />
      
      <AssignVolunteerModal
        requestId={selectedRequest?.id || null}
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedRequest(null);
        }}
      />
    </div>
  );
};

export default AdminEmergencyRequests;
