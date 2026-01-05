import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { MoreHorizontal, Search, Filter, AlertCircle, Phone, MapPin, Hash } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RequestDetailsModal } from '@/components/organisms/RequestDetailsModal';
import { AssignVolunteerModal } from '@/components/organisms/AssignVolunteerModal';
import { cn } from '@/lib/utils';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const AdminEmergencyRequests = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['help-requests', page, limit, searchTerm, severityFilter, typeFilter],
    queryFn: () => api.listHelpRequests({
      page,
      limit,
      search: searchTerm,
      severity: severityFilter,
      type: typeFilter
    })
  });

  // Handle both paginated and non-paginated potential responses during migration
  const requests = Array.isArray(responseData) ? responseData : responseData?.data || [];
  const meta = !Array.isArray(responseData) ? responseData?.meta : null;

  // Requests are now filtered on the server
  const filteredRequests = requests;

  const getSeverityStyles = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
    }
  };

  const getUrgencyStyles = (score: number) => {
    if (score >= 80) return 'text-red-600 font-bold';
    if (score >= 50) return 'text-orange-600 font-medium';
    return 'text-green-600';
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('Emergency Requests')}</h2>
          <p className="text-slate-500 mt-1">{t('Manage and triage incoming help requests from the community.')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters moved to toolbar */}
          <Button>
            {t('Export Data')}
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden ring-1 ring-slate-200/60">
        <div className="p-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-2">
            <div className="bg-red-50 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-lg text-slate-800">{t('Active Cases')}</h3>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 ml-2 rounded-full px-2.5">
              {meta ? meta.total : (filteredRequests?.length || 0)}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Assistance Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="search_rescue">Search & Rescue</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="shelter">Shelter</SelectItem>
                <SelectItem value="logistics">Logistics</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('Search ID, name...')}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-lg"
              />
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[120px] pl-6">{t('Case ID')}</TableHead>
                <TableHead>{t('Severity')}</TableHead>
                <TableHead>{t('Urgency')}</TableHead>
                <TableHead>{t('Requester')}</TableHead>
                <TableHead>{t('Location')}</TableHead>
                <TableHead>{t('Assistance Type')}</TableHead>
                <TableHead>{t('Submitted')}</TableHead>
                <TableHead className="text-right pr-6">{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                      {t('Loading requests...')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRequests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                    {t('No requests found matching your criteria.')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests?.map((request: any) => (
                  <TableRow key={request.id} className="hover:bg-slate-50/60 border-slate-100 group transition-colors">
                    <TableCell className="pl-6 align-top py-4">
                      <div className="flex items-center gap-2 font-mono text-sm font-medium text-slate-700">
                        <Hash className="h-3.5 w-3.5 text-slate-400" />
                        {request.caseId || request.case_id || 'N/A'}
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <Badge variant="outline" className={cn("rounded-md px-2 py-0.5 border capitalize", getSeverityStyles(request.severity))}>
                        {request.severity}
                      </Badge>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className={cn("text-sm font-semibold", getUrgencyStyles(request.urgencyScore ?? 0))}>
                        {request.urgencyScore ?? 0}%
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{request.name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {request.phone}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="flex items-start gap-1.5 text-sm text-slate-600 max-w-[200px] truncate">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={request.address}>{request.address}</span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="flex flex-wrap gap-1">
                        {request.types?.map((t: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 text-xs font-normal">
                            {t.name || t.type}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <span className="text-sm text-slate-500">
                        {(() => {
                          try {
                            const dateStr = request.createdAt || request.created_at;
                            return dateStr ? format(new Date(dateStr), 'MMM d, HH:mm') : 'N/A';
                          } catch (e) {
                            return 'Invalid Date';
                          }
                        })()}
                      </span>
                    </TableCell>

                    <TableCell className="text-right pr-6 align-top py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
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
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            {t('Close Case')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {meta && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {t('Showing')} <span className="font-medium">{(meta.current_page - 1) * meta.per_page + 1}</span> {t('to')}{' '}
                <span className="font-medium">{Math.min(meta.current_page * meta.per_page, meta.total)}</span> {t('of')}{' '}
                <span className="font-medium">{meta.total}</span> {t('results')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1}
                >
                  {t('Previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={meta.current_page >= meta.last_page}
                >
                  {t('Next')}
                </Button>
              </div>
            </div>
          )}
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
