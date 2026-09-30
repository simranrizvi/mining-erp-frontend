'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

export default function LeavePage() {
  const { hasPermission } = useAuth();
  const { items, meta, params, updateParams, isLoading, create, runAction } = useResource('/hr/leave');
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState('approved');

  useEffect(() => {
    (async () => {
      const [empRes, ltRes] = await Promise.all([api.get('/hr/employees?limit=200'), api.get('/settings/leave-types')]);
      setEmployees(empRes.data.data);
      setLeaveTypes(ltRes.data.data);
    })();
  }, []);

  const fields = [
    { name: 'employeeId', label: 'Employee', type: 'select', required: true, fullWidth: true,
      options: employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeCode})` })) },
    { name: 'leaveTypeId', label: 'Leave Type', type: 'select', required: true,
      options: leaveTypes.map((lt) => ({ value: lt.id, label: lt.name })) },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'reason', label: 'Reason', type: 'textarea', fullWidth: true },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Requests"
        description="Apply for and manage employee leave requests."
        actions={
          hasPermission('hr.leave:create') && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> New Leave Request
            </Button>
          )
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Select value={params.status || 'all'} onValueChange={(v) => updateParams({ status: v === 'all' ? '' : v })}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'employee', header: 'Employee', render: (r) => `${r.employee.firstName} ${r.employee.lastName}` },
          { key: 'leaveType', header: 'Leave Type', render: (r) => r.leaveType.name },
          { key: 'startDate', header: 'From', render: (r) => formatDate(r.startDate) },
          { key: 'endDate', header: 'To', render: (r) => formatDate(r.endDate) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'reason', header: 'Reason', render: (r) => <span className="line-clamp-1 max-w-[200px] block">{r.reason || '—'}</span> },
        ]}
        rows={items}
        actions={
          hasPermission('hr.leave:approve')
            ? (row) =>
                row.status === 'pending' && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setActionTarget(row); setActionType('approved'); }}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setActionTarget(row); setActionType('rejected'); }}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
            : undefined
        }
      />
      <Pagination meta={meta} onPageChange={(page) => updateParams({ page })} />

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} title="Apply for Leave" fields={fields} onSubmit={(values) => create(values)} />

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={(v) => !v && setActionTarget(null)}
        title={`${actionType === 'approved' ? 'Approve' : 'Reject'} leave request?`}
        description={`This will mark the leave request as ${actionType} for ${actionTarget?.employee?.firstName}.`}
        isDestructive={actionType === 'rejected'}
        confirmLabel={actionType === 'approved' ? 'Approve' : 'Reject'}
        onConfirm={() =>
          runAction(() => api.patch(`/hr/leave/${actionTarget.id}/action`, { status: actionType }), {
            successMessage: `Leave request ${actionType}`,
          })
        }
      />
    </div>
  );
}
