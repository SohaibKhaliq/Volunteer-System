import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function AdminResourcesDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useQuery(['resources', 'dashboard'], () =>
    api.getResourcesDashboard()
  );
  const { data: lowStock, isLoading: lowLoading } = useQuery(['resources', 'low-stock'], () =>
    api.getLowStockResources()
  );
  const { data: maintenance, isLoading: maintLoading } = useQuery(['resources', 'maintenance'], () =>
    api.getMaintenanceDueResources()
  );

  const ds = dashboard?.data ?? dashboard ?? {};
  const low = Array.isArray(lowStock) ? lowStock : (lowStock?.data ?? []);
  const due = Array.isArray(maintenance) ? maintenance : (maintenance?.data ?? []);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resources Dashboard</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Resources</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{dashLoading ? '—' : (ds.total ?? '—')}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{lowLoading ? '—' : (low.length ?? 0)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Maintenance Due</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{maintLoading ? '—' : (due.length ?? 0)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {low.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No low-stock items
                    </TableCell>
                  </TableRow>
                ) : (
                  low.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.quantityAvailable ?? r.quantity_available ?? '—'}</TableCell>
                      <TableCell>{Math.ceil((r.quantityTotal ?? r.quantity_total ?? 0) * 0.1)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Due</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {due.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No maintenance due
                    </TableCell>
                  </TableRow>
                ) : (
                  due.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{d.maintenanceDue ? new Date(d.maintenanceDue).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="line-clamp-2">{d.description ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
