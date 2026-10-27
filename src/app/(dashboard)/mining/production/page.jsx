'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Button } from '@/components/ui/button';
import { formatDate, formatNumber } from '@/lib/utils';

export default function ProductionPage() {
  const { hasPermission } = useAuth();
  const { items, meta, updateParams, isLoading, create, update, remove } = useResource('/mining/production');
  const [mineSites, setMineSites] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const [sitesRes, eqRes] = await Promise.all([api.get('/mine-sites?limit=100'), api.get('/equipment?limit=200')]);
      setMineSites(sitesRes.data.data);
      setEquipment(eqRes.data.data);
    })();
  }, []);

  const fields = [
    { name: 'mineSiteId', label: 'Mine Site', type: 'select', required: true, fullWidth: true, options: mineSites.map((s) => ({ value: s.id, label: s.name })) },
    { name: 'date', label: 'Date', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
    { name: 'shift', label: 'Shift', type: 'select', options: [{ value: 'day', label: 'Day' }, { value: 'night', label: 'Night' }] },
    { name: 'materialType', label: 'Material Type', required: true, placeholder: 'e.g. Coal, Iron Ore' },
    { name: 'quantity', label: 'Quantity', type: 'number', step: '0.01', required: true },
    { name: 'unit', label: 'Unit', default: 'tons' },
    { name: 'equipmentId', label: 'Equipment Used', type: 'select', options: equipment.map((e) => ({ value: e.id, label: e.name })) },
    { name: 'qualityGrade', label: 'Quality Grade' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', fullWidth: true },
  ];

  return (
    <div>
      <PageHeader
        title="Production Tracking"
        description="Log and monitor daily material output across all mine sites."
        actions={
          hasPermission('mining.production:create') && (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Log Production
            </Button>
          )
        }
      />

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
          { key: 'mineSite', header: 'Mine Site', render: (r) => r.mineSite?.name },
          { key: 'materialType', header: 'Material' },
          { key: 'quantity', header: 'Quantity', render: (r) => `${formatNumber(r.quantity, 2)} ${r.unit}` },
          { key: 'shift', header: 'Shift', render: (r) => r.shift },
          { key: 'equipment', header: 'Equipment', render: (r) => r.equipment?.name || '—' },
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex justify-end gap-1">
            {hasPermission('mining.production:update') && (
              <Button variant="ghost" size="icon" onClick={() => { setEditing(row); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {hasPermission('mining.production:delete') && (
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
        title={editing ? 'Edit Production Record' : 'Log Production'}
        fields={fields}
        initialValues={editing ? { ...editing, mineSiteId: editing.mineSite?.id, equipmentId: editing.equipment?.id, date: editing.date } : null}
        onSubmit={(values) => (editing ? update(editing.id, values) : create(values))}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete production record?"
        onConfirm={() => remove(deleteTarget.id)}
      />
    </div>
  );
}
