import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/atoms/use-toast';
import { axios } from '@/lib/axios';

const ENTITIES = [
  { key: 'help_requests', label: 'Help Requests' },
  { key: 'offers', label: 'Help Offers' },
  { key: 'carpooling_ads', label: 'Carpooling' }
];

export default function AdminApprovals() {
  const [entity, setEntity] = useState(ENTITIES[0].key);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const load = async () => {
    try {
      const res: any = await axios.get(`/admin/approvals/${entity}`, { params: { page, per_page: perPage } });
      // normalize: backend may return array or paginated object
      if (Array.isArray(res)) {
        setItems(res);
        setTotal(res.length);
      } else {
        const list = res.data ?? res.items ?? [];
        const t = res.total ?? res.meta?.total ?? list.length;
        setItems(list);
        setTotal(t);
      }
    } catch (err) {
      toast({ title: 'Failed to load', description: 'Could not load pending items.' });
    }
  };

  useEffect(() => {
    setPage(1);
  }, [entity]);

  useEffect(() => {
    load();
  }, [entity, page, perPage]);

  const approve = async (id: number) => {
    try {
      await axios.post(`/admin/approvals/${entity}/${id}/approve`);
      toast({ title: 'Approved' });
      load();
    } catch (err: any) {
      console.error('Approve error', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to approve';
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
    }
  };

  const reject = async (id: number) => {
    try {
      await axios.post(`/admin/approvals/${entity}/${id}/reject`);
      toast({ title: 'Rejected' });
      load();
    } catch (err: any) {
      console.error('Reject error', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to reject';
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex gap-3 mb-6">
        {ENTITIES.map((e) => (
          <Button key={e.key} variant={e.key === entity ? 'default' : 'outline'} onClick={() => setEntity(e.key)}>
            {e.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((it) => (
          <Card key={it.id}>
            <CardHeader>
              <CardTitle>{it.title || it.name || `#${it.id}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{it.description || it.address}</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => reject(it.id)} size="sm">
                    Reject
                  </Button>
                  <Button onClick={() => approve(it.id)} size="sm">
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {total > perPage && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.max(1, Math.ceil(total / perPage))}
          </div>
          <Button variant="outline" disabled={page * perPage >= total} onClick={() => setPage(page + 1)}>
            Next
          </Button>

          <div className="ml-4 flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Per page</div>
            <select
              value={String(perPage)}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border px-2 h-8 bg-white text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
