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
import { formatDate } from '@/lib/utils';

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const { items, meta, updateParams, isLoading, create, update, remove } = useResource('/hr/employees');
  const [departments, setDepartments] = useState([]);
  const [mineSites, setMineSites] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const [deptRes, sitesRes] = await Promise.all([api.get('/settings/departments'), api.get('/mine-sites?limit=100')]);
      setDepartments(deptRes.data.data);
      setMineSites(sitesRes.data.data);
    })();
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
  ];

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
        onSubmit={(values) => (editing ? update(editing.id, values) : create(values))}
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
