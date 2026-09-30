'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const fields = [
  { name: 'name', label: 'Site Name', required: true, fullWidth: true },
  { name: 'code', label: 'Site Code', required: true, placeholder: 'e.g. MS-02' },
  {
    name: 'status', label: 'Status', type: 'select',
    options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'closed', label: 'Closed' }],
  },
  { name: 'location', label: 'Location', fullWidth: true },
  { name: 'areaHectares', label: 'Area (hectares)', type: 'number', step: '0.01' },
  { name: 'establishedDate', label: 'Established Date', type: 'date' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

export default function MineSitesPage() {
  const { hasPermission } = useAuth();
  const { items, meta, updateParams, isLoading, create, update, remove } = useResource('/mine-sites');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <div>
      <PageHeader
        title="Mine Sites"
        description="Manage all operational mine sites across the company."
        actions={
          hasPermission('mine_sites:create') && (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> New Mine Site
            </Button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput onSearch={(search) => updateParams({ search })} placeholder="Search by name or code..." />
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'name', header: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
          { key: 'code', header: 'Code', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
          { key: 'location', header: 'Location' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'employees', header: 'Employees', render: (r) => r._count?.employees ?? 0 },
          { key: 'establishedDate', header: 'Established', render: (r) => formatDate(r.establishedDate) },
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex justify-end gap-1">
            {hasPermission('mine_sites:update') && (
              <Button variant="ghost" size="icon" onClick={() => { setEditing(row); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {hasPermission('mine_sites:delete') && (
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
        title={editing ? 'Edit Mine Site' : 'Create Mine Site'}
        fields={fields}
        initialValues={editing}
        onSubmit={(values) => (editing ? update(editing.id, values) : create(values))}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This cannot be undone. All related records referencing this site may be affected."
        onConfirm={() => remove(deleteTarget.id)}
      />
    </div>
  );
}
