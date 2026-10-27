'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operational' }, { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'breakdown', label: 'Breakdown' }, { value: 'retired', label: 'Retired' },
];

export default function VehiclesPage() {
  const { hasPermission } = useAuth();
  const { items, meta, updateParams, isLoading, create, update, remove } = useResource('/vehicles');
  const [mineSites, setMineSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const [sitesRes, empRes] = await Promise.all([api.get('/mine-sites?limit=100'), api.get('/hr/employees?limit=200')]);
      setMineSites(sitesRes.data.data);
      setEmployees(empRes.data.data);
    })();
  }, []);

  const fields = [
    { name: 'name', label: 'Vehicle Name', required: true, fullWidth: true },
    { name: 'plateNumber', label: 'Plate Number', required: true },
    { name: 'type', label: 'Type', required: true, placeholder: 'e.g. Dump Truck' },
    { name: 'make', label: 'Make' },
    { name: 'model', label: 'Model' },
    { name: 'year', label: 'Year', type: 'number' },
    { name: 'mineSiteId', label: 'Mine Site', type: 'select', options: mineSites.map((s) => ({ value: s.id, label: s.name })) },
    { name: 'assignedDriverId', label: 'Assigned Driver', type: 'select', options: employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })) },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'currentOdometer', label: 'Current Odometer (km)', type: 'number', step: '0.1' },
    { name: 'fuelType', label: 'Fuel Type', default: 'diesel' },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Manage the fleet of vehicles used across mine sites."
        actions={
          hasPermission('vehicles:create') && (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Add Vehicle
            </Button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput onSearch={(search) => updateParams({ search })} placeholder="Search by name or plate number..." />
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'name', header: 'Vehicle', render: (r) => <span className="font-medium">{r.name}</span> },
          { key: 'plateNumber', header: 'Plate', render: (r) => <span className="font-mono text-xs">{r.plateNumber}</span> },
          { key: 'type', header: 'Type' },
          { key: 'driver', header: 'Driver', render: (r) => (r.assignedDriver ? `${r.assignedDriver.firstName} ${r.assignedDriver.lastName}` : '—') },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'currentOdometer', header: 'Odometer', render: (r) => `${formatNumber(r.currentOdometer)} km` },
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex justify-end gap-1">
            {hasPermission('vehicles:update') && (
              <Button variant="ghost" size="icon" onClick={() => { setEditing(row); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {hasPermission('vehicles:delete') && (
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      />
      <Pagination meta={meta} onPageChange={(page) => updateParams({ page })} />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
        fields={fields}
        initialValues={editing ? { ...editing, mineSiteId: editing.mineSite?.id, assignedDriverId: editing.assignedDriver?.id } : null}
        onSubmit={(values) => (editing ? update(editing.id, values) : create(values))}
      />

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={`Delete ${deleteTarget?.name}?`} onConfirm={() => remove(deleteTarget.id)} />
    </div>
  );
}
