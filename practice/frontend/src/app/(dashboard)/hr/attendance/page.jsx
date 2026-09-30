'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Button } from '@/components/ui/button';
import { CalendarCheck, CalendarX, Clock, Umbrella } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const { items, meta, params, updateParams, isLoading, create } = useResource('/hr/attendance', { page: 1, limit: 10, date: new Date().toISOString().slice(0, 10) });
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

useEffect(() => {
  (async () => {
    try {
      // Dono APIs ko alag-alag try karein taaki ek fail ho toh doosri na ruke
      const [empRes, summaryRes] = await Promise.allSettled([
        api.get('/hr/employees?limit=200'),
        api.get('/hr/attendance/summary'),
      ]);

      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data.data);
      } else {
        console.warn('Employees access denied or failed:', empRes.reason);
      }

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data.data);
      } else {
        console.warn('Summary access denied or failed:', summaryRes.reason);
      }
    } catch (err) {
      console.error('Failed to load attendance metadata:', err);
    }
  })();
}, []);

  const fields = [
    { name: 'employeeId', label: 'Employee', type: 'select', required: true, fullWidth: true,
      options: employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeCode})` })) },
    { name: 'date', label: 'Date', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
    {
      name: 'status', label: 'Status', type: 'select', required: true,
      options: [
        { value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' },
        { value: 'late', label: 'Late' }, { value: 'half_day', label: 'Half Day' }, { value: 'on_leave', label: 'On Leave' },
      ],
    },
    { name: 'remarks', label: 'Remarks', type: 'textarea', fullWidth: true },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Daily attendance records across all mine sites."
        actions={
          hasPermission('hr.attendance:create') && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Record Attendance
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <StatCard label="Present Today" icon={CalendarCheck} accent="success" value={summary?.present ?? '—'} />
        <StatCard label="Absent Today" icon={CalendarX} accent="destructive" value={summary?.absent ?? '—'} />
        <StatCard label="Late Today" icon={Clock} accent="warning" value={summary?.late ?? '—'} />
        <StatCard label="On Leave Today" icon={Umbrella} value={summary?.onLeave ?? '—'} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Label htmlFor="date-filter" className="text-sm">Filter by date:</Label>
        <Input
          id="date-filter"
          type="date"
          className="w-44"
          value={params.date}
          onChange={(e) => updateParams({ date: e.target.value })}
        />
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'employee', header: 'Employee', render: (r) => `${r.employee.firstName} ${r.employee.lastName}` },
          { key: 'employeeCode', header: 'Code', render: (r) => <span className="font-mono text-xs">{r.employee.employeeCode}</span> },
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'checkIn', header: 'Check In', render: (r) => (r.checkIn ? formatDateTime(r.checkIn) : '—') },
          { key: 'checkOut', header: 'Check Out', render: (r) => (r.checkOut ? formatDateTime(r.checkOut) : '—') },
        ]}
        rows={items}
      />
      <Pagination meta={meta} onPageChange={(page) => updateParams({ page })} />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Record Attendance"
        fields={fields}
        onSubmit={(values) => create(values, { path: '/check-in' })}
      />
    </div>
  );
}
