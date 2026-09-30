'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDateTime } from '@/lib/utils';

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const { items, meta, params, updateParams, isLoading, create, update, remove } = useResource('/users');
  const [roles, setRoles] = useState([]);
  const [mineSites, setMineSites] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const [rolesRes, sitesRes] = await Promise.all([api.get('/roles'), api.get('/mine-sites?limit=100')]);
      setRoles(rolesRes.data.data);
      setMineSites(sitesRes.data.data);
    })();
  }, []);

  const fields = [
    { name: 'name', label: 'Full Name', required: true, fullWidth: true },
    { name: 'email', label: 'Email', type: 'email', required: true, fullWidth: true },
    ...(editingUser ? [] : [{ name: 'password', label: 'Temporary Password', type: 'password', required: true, fullWidth: true }]),
    { name: 'phone', label: 'Phone' },
    {
      name: 'roleId', label: 'Role', type: 'select', required: true,
      options: roles.map((r) => ({ value: r.id, label: r.name })),
    },
    {
      name: 'mineSiteId', label: 'Mine Site', type: 'select',
      options: mineSites.map((s) => ({ value: s.id, label: s.name })),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage system users and their assigned roles."
        actions={
          hasPermission('users:create') && (
            <Button onClick={() => { setEditingUser(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> New User
            </Button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput onSearch={(search) => updateParams({ search })} placeholder="Search by name or email..." />
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          {
            key: 'name', header: 'User',
            render: (row) => (
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{row.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium leading-tight">{row.name}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{row.email}</p>
                </div>
              </div>
            ),
          },
          { key: 'role', header: 'Role', render: (row) => row.role?.name },
          { key: 'mineSite', header: 'Mine Site', render: (row) => row.mineSite?.name || '—' },
          { key: 'isActive', header: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
          { key: 'lastLoginAt', header: 'Last Login', render: (row) => formatDateTime(row.lastLoginAt) },
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex justify-end gap-1">
            {hasPermission('users:update') && (
              <Button variant="ghost" size="icon" onClick={() => setResetTarget(row)} title="Reset password">
                <KeyRound className="h-4 w-4" />
              </Button>
            )}
            {hasPermission('users:update') && (
              <Button variant="ghost" size="icon" onClick={() => { setEditingUser(row); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {hasPermission('users:delete') && (
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
        title={editingUser ? 'Edit User' : 'Create User'}
        fields={fields}
        initialValues={editingUser ? { ...editingUser, roleId: editingUser.role?.id, mineSiteId: editingUser.mineSite?.id } : null}
        submitLabel={editingUser ? 'Save Changes' : 'Create User'}
        onSubmit={async (values) => {
          if (editingUser) {
            const { password, email, ...rest } = values;
            await update(editingUser.id, rest);
          } else {
            await create(values);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This will permanently remove the user's access. This action cannot be undone."
        onConfirm={() => remove(deleteTarget.id)}
      />

      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(v) => !v && setResetTarget(null)}
        title={`Reset password for ${resetTarget?.name}?`}
        description="They will be issued a temporary password and required to change it on next login."
        isDestructive={false}
        confirmLabel="Reset Password"
        onConfirm={() => update(resetTarget.id, { newPassword: `Reset@${Math.floor(1000 + Math.random() * 9000)}` }, { path: '/reset-password', method: 'post' })}
      />
    </div>
  );
}
