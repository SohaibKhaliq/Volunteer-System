import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table'; // Assuming generic data table component exists
import { Badge } from '@/components/ui/badge';
import { Plus, calendar, MoreHorizontal, Eye, Edit, Trash, CheckCircle, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function OrganizationOpportunities() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['org-opportunities', page, search],
    queryFn: async () => {
      const res = await api.get('/organization/opportunities', {
        params: { page, search }
      });
      return res.data;
    }
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const publish = status === 'published';
      return api.post(`/organization/opportunities/${id}/publish`, { publish });
    },
    onSuccess: () => {
      toast.success('Opportunity status updated');
      queryClient.invalidateQueries({ queryKey: ['org-opportunities'] });
    },
    onError: () => toast.error('Failed to update status')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/organization/opportunities/${id}`);
    },
    onSuccess: () => {
      toast.success('Opportunity deleted');
      queryClient.invalidateQueries({ queryKey: ['org-opportunities'] });
    },
    onError: () => toast.error('Failed to delete opportunity')
  });

  // Table Columns
  const columns = [
    {
      header: 'Title',
      accessorKey: 'title'
    },
    {
      header: 'Date',
      accessorFn: (row: any) => format(new Date(row.startAt), 'MMM dd, yyyy')
    },
    {
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return <Badge variant={status === 'published' ? 'default' : 'secondary'}>{status}</Badge>;
      }
    },
    {
      header: 'Applications',
      accessorKey: 'application_count', // Assuming backend sends this or we preload
      cell: ({ row }: any) => {
        // If we don't have exact count yet, maybe show capacity
        return (
          <span>
            {row.original.capacity > 0
              ? `${row.original.application_count || 0} / ${row.original.capacity}`
              : 'Unlimited'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const opp = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/volunteer/opportunities/${opp.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View Public Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/organization/opportunities/${opp.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/organization/opportunities/${opp.id}/applications`)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Manage Applications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {opp.status !== 'published' ? (
                <DropdownMenuItem onClick={() => publishMutation.mutate({ id: opp.id, status: 'published' })}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Publish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => publishMutation.mutate({ id: opp.id, status: 'draft' })}>
                  <XCircle className="mr-2 h-4 w-4 text-orange-600" /> Unpublish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(opp.id)}>
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  // Basic Table if DataTable not fully compatible or complex
  // Using a simple table layout for robustness in this step

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Opportunities</h2>
          <p className="text-muted-foreground">Manage your volunteering events and shifts.</p>
        </div>
        <Button onClick={() => navigate('/organization/opportunities/create')}>
          <Plus className="mr-2 h-4 w-4" /> Create Opportunity
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search opportunities..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Title</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Capacity</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : opportunities?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No opportunities found.
                  </td>
                </tr>
              ) : (
                opportunities?.data?.map((opp: any) => (
                  <tr key={opp.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 font-medium">{opp.title}</td>
                    <td className="p-4">{format(new Date(opp.startAt), 'MMM dd, yyyy p')}</td>
                    <td className="p-4">
                      <Badge variant={opp.status === 'published' ? 'default' : 'secondary'}>{opp.status}</Badge>
                    </td>
                    <td className="p-4">
                      {opp.capacity > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{opp.application_count || 0}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{opp.capacity}</span>
                        </div>
                      ) : (
                        '∞'
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/volunteer/opportunities/${opp.id}`)}>
                            View Public
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/organization/opportunities/${opp.id}/edit`)}>
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500" onClick={() => deleteMutation.mutate(opp.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
