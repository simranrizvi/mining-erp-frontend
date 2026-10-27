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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/utils';

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const { items, meta, updateParams, isLoading, create, update, remove } = useResource('/hr/employees');
  const [departments, setDepartments] = useState([]);
  const [mineSites, setMineSites] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const [deptRes, sitesRes, rolesRes] = await Promise.allSettled([
        api.get('/settings/departments'),
        api.get('/mine-sites?limit=100'),
        hasPermission('roles:read') ? api.get('/roles') : Promise.reject(new Error('roles:read not granted')),
      ]);
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data.data);
      if (sitesRes.status === 'fulfilled') setMineSites(sitesRes.value.data.data);
      if (rolesRes.status === 'fulfilled') setRoles(Array.isArray(rolesRes.value.data.data) ? rolesRes.value.data.data : rolesRes.value.data.data.items || []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fields = [
    { name: 'firstName', label: 'First Name', required: true },
    { name: 'lastName', label: 'Last Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true, fullWidth: true },
    { name: 'phone', label: 'Phone' },
    { name: 'designation', label: 'Designation' },
    { name: 'departmentId', label: 'Department', type: 'select', options: departments.map((d) => ({ value: d.id, label: d.name })) },
    { name: 'mineSiteId', label: 'Mine Site', type: 'select', options: mineSites.map((s) => ({ value: s.id, label: s.name })) },
    {
      name: 'employmentType', label: 'Employment Type', type: 'select',
      options: [{ value: 'full_time', label: 'Full-time' }, { value: 'part_time', label: 'Part-time' }, { value: 'contract', label: 'Contract' }],
    },
    { name: 'dateOfJoining', label: 'Date of Joining', type: 'date' },
    { name: 'basicSalary', label: 'Basic Salary', type: 'number', step: '0.01' },
    ...(roles.length
      ? [
          {
            name: 'createLoginAccount', label: 'Create Login Account', type: 'checkbox', fullWidth: true,
            checkboxLabel: 'Also create a system login (email + temporary password) for this employee',
          },
          {
            name: 'roleId', label: 'Login Role', type: 'select', fullWidth: true, required: true,
            showIf: (v) => !!v.createLoginAccount && !editing,
            options: roles.map((r) => ({ value: r.id, label: r.name })),
          },
        ]
      : []),
  ];

  const handleSubmit = async (values) => {
    if (editing) {
      const { createLoginAccount, roleId, ...patch } = values;
      return update(editing.id, patch);
    }
    const created = await create(values, { successMessage: false });
    if (created?.tempPassword) {
      toast({
        title: 'Employee created — login credentials',
        description: `Email: ${created.email}  |  Temp password: ${created.tempPassword} (must change on first login)`,
        variant: 'success',
      });
    } else {
      toast({ title: 'Created successfully', variant: 'success' });
    }
    return created;
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage employee records across all mine sites."
        actions={
          hasPermission('hr.employees:create') && (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> New Employee
            </Button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput onSearch={(search) => updateParams({ search })} placeholder="Search by name, code, or email..." />
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          {
            key: 'name', header: 'Employee',
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8"><AvatarFallback>{r.firstName[0]}{r.lastName[0]}</AvatarFallback></Avatar>
                <div>
                  <p className="font-medium leading-tight">{r.firstName} {r.lastName}</p>
                  <p className="text-xs text-muted-foreground leading-tight font-mono">{r.employeeCode}</p>
                </div>
              </div>
            ),
          },
          { key: 'department', header: 'Department', render: (r) => r.department?.name || '—' },
          { key: 'mineSite', header: 'Mine Site', render: (r) => r.mineSite?.name || '—' },
          { key: 'designation', header: 'Designation', render: (r) => r.designation || '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'dateOfJoining', header: 'Joined', render: (r) => formatDate(r.dateOfJoining) },
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex justify-end gap-1">
            {hasPermission('hr.employees:update') && (
              <Button variant="ghost" size="icon" onClick={() => { setEditing(row); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {hasPermission('hr.employees:delete') && (
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
        title={editing ? 'Edit Employee' : 'Onboard Employee'}
        fields={fields}
        initialValues={editing ? { ...editing, departmentId: editing.department?.id, mineSiteId: editing.mineSite?.id } : null}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}?`}
        description="This permanently deletes the employee record. This cannot be undone."
        onConfirm={() => remove(deleteTarget.id)}
      />
    </div>
  );
}
