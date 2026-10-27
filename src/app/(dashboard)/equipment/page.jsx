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
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Button } from '@/components/ui/button';
import { Wrench, CheckCircle2, AlertTriangle, Archive } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operational' }, { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'breakdown', label: 'Breakdown' }, { value: 'retired', label: 'Retired' },
];

export default function EquipmentPage() {
  const { hasPermission } = useAuth();
  const { items, meta, updateParams, isLoading, create, update, remove } = useResource('/equipment');
  const [mineSites, setMineSites] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const [sitesRes, utilRes] = await Promise.all([api.get('/mine-sites?limit=100'), api.get('/equipment/utilization')]);
      setMineSites(sitesRes.data.data);
      setUtilization(utilRes.data.data);
    })();
  }, [items.length]);

  const fields = [
    { name: 'name', label: 'Equipment Name', required: true, fullWidth: true },
    { name: 'code', label: 'Asset Code', required: true },
    { name: 'type', label: 'Type', required: true, placeholder: 'e.g. Excavator, Drill' },
    { name: 'manufacturer', label: 'Manufacturer' },
    { name: 'model', label: 'Model' },
    { name: 'mineSiteId', label: 'Mine Site', type: 'select', options: mineSites.map((s) => ({ value: s.id, label: s.name })) },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
    { name: 'purchaseCost', label: 'Purchase Cost', type: 'number', step: '0.01' },
    { name: 'currentHours', label: 'Current Operating Hours', type: 'number', step: '0.1' },
  ];

  return (
    <div>
      <PageHeader
        title="Equipment"
        description="Track heavy machinery across all mine sites."
        actions={
          hasPermission('equipment:create') && (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Add Equipment
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <StatCard label="Operational" icon={CheckCircle2} accent="success" value={utilization?.operational ?? '—'} />
        <StatCard label="Under Maintenance" icon={Wrench} accent="warning" value={utilization?.underMaintenance ?? '—'} />
        <StatCard label="Breakdown" icon={AlertTriangle} accent="destructive" value={utilization?.breakdown ?? '—'} />
        <StatCard label="Retired" icon={Archive} value={utilization?.retired ?? '—'} />
      </div>

      <div className="mb-4">
        <SearchInput onSearch={(search) => updateParams({ search })} placeholder="Search by name or code..." />
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'name', header: 'Equipment', render: (r) => <span className="font-medium">{r.name}</span> },
          { key: 'code', header: 'Code', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
          { key: 'type', header: 'Type' },
          { key: 'mineSite', header: 'Mine Site', render: (r) => r.mineSite?.name || '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'currentHours', header: 'Hours', render: (r) => r.currentHours },
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex justify-end gap-1">
            {hasPermission('equipment:update') && (
              <Button variant="ghost" size="icon" onClick={() => { setEditing(row); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {hasPermission('equipment:delete') && (
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
        title={editing ? 'Edit Equipment' : 'Add Equipment'}
        fields={fields}
        initialValues={editing ? { ...editing, mineSiteId: editing.mineSite?.id } : null}
        onSubmit={(values) => (editing ? update(editing.id, values) : create(values))}
      />

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={`Delete ${deleteTarget?.name}?`} onConfirm={() => remove(deleteTarget.id)} />
    </div>
  );
}
