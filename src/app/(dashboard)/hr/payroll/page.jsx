'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Banknote, FileCheck2, CircleDollarSign, FileClock, Wand2 } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

export default function PayrollPage() {
  const { hasPermission } = useAuth();
  const { items, meta, params, updateParams, isLoading, create, update, remove, runAction } = useResource('/hr/payroll');
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionNext, setActionNext] = useState('processed');

  const fetchSummary = useCallback(async () => {
    try {
      const query = [params.month ? `month=${params.month}` : '', params.year ? `year=${params.year}` : '']
        .filter(Boolean)
        .join('&');
      const { data } = await api.get(`/hr/payroll/summary${query ? `?${query}` : ''}`);
      setSummary(data.data);
    } catch {
      setSummary(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.month, params.year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, items]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/hr/employees?limit=200');
        setEmployees(data.data);
      } catch {
        setEmployees([]);
      }
    })();
  }, []);

  const fields = [
    { name: 'employeeId', label: 'Employee', type: 'select', required: true, fullWidth: true,
      options: employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeCode})` })) },
    { name: 'month', label: 'Month', type: 'select', required: true, default: String(new Date().getMonth() + 1),
      options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) },
    { name: 'year', label: 'Year', type: 'select', required: true, default: String(CURRENT_YEAR),
      options: YEARS.map((y) => ({ value: String(y), label: String(y) })) },
    { name: 'basicSalary', label: 'Basic Salary', type: 'number', step: '0.01', required: true },
    { name: 'allowances', label: 'Allowances', type: 'number', step: '0.01', default: 0 },
    { name: 'deductions', label: 'Deductions', type: 'number', step: '0.01', default: 0 },
    { name: 'overtimePay', label: 'Overtime Pay', type: 'number', step: '0.01', default: 0 },
  ];
  const editFields = fields.filter((f) => !['employeeId', 'month', 'year'].includes(f.name));
  const generateFields = [
    { name: 'month', label: 'Month', type: 'select', required: true, fullWidth: true, default: String(new Date().getMonth() + 1),
      options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) },
    { name: 'year', label: 'Year', type: 'select', required: true, fullWidth: true, default: String(CURRENT_YEAR),
      options: YEARS.map((y) => ({ value: String(y), label: String(y) })) },
  ];

  const coerceNumbers = (values) => ({
    ...values,
    basicSalary: Number(values.basicSalary),
    allowances: Number(values.allowances || 0),
    deductions: Number(values.deductions || 0),
    overtimePay: Number(values.overtimePay || 0),
    month: Number(values.month),
    year: Number(values.year),
  });

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Generate, review and pay monthly payroll for employees."
        actions={
          <div className="flex items-center gap-2">
            {hasPermission('hr.payroll:create') && (
              <>
                <Button variant="outline" onClick={() => setGenerateOpen(true)}>
                  <Wand2 className="h-4 w-4" /> Generate Drafts
                </Button>
                <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4" /> New Payroll
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Records" icon={Banknote} value={summary ? summary.totalRecords : '—'} />
        <StatCard label="Drafts" icon={FileClock} accent="warning" value={summary ? summary.byStatus.draft : '—'} />
        <StatCard label="Processed" icon={FileCheck2} value={summary ? summary.byStatus.processed : '—'} />
        <StatCard
          label="Net Payable"
          icon={CircleDollarSign}
          accent="success"
          value={summary ? formatCurrency(summary.totalNetPayable) : '—'}
          hint={`${summary ? summary.byStatus.paid : 0} paid`}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <Label className="text-sm">Status</Label>
          <Select value={params.status || 'all'} onValueChange={(v) => updateParams({ status: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Month</Label>
          <Select value={params.month ? String(params.month) : 'all'} onValueChange={(v) => updateParams({ month: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Year</Label>
          <Select value={params.year ? String(params.year) : 'all'} onValueChange={(v) => updateParams({ year: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-28"><SelectValue placeholder="All years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Search employee</Label>
          <Input
            className="w-56"
            placeholder="Name or code..."
            defaultValue={params.search || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') updateParams({ search: e.currentTarget.value });
            }}
          />
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'employee', header: 'Employee',
            render: (r) => (
              <div>
                <p className="font-medium leading-tight">{r.employee.firstName} {r.employee.lastName}</p>
                <p className="font-mono text-xs text-muted-foreground leading-tight">{r.employee.employeeCode}</p>
              </div>
            ) },
          { key: 'period', header: 'Period', render: (r) => `${MONTHS[r.month - 1]} ${r.year}` },
          { key: 'basicSalary', header: 'Basic', render: (r) => formatCurrency(r.basicSalary) },
          { key: 'allowances', header: 'Allowances', render: (r) => formatCurrency(r.allowances) },
          { key: 'deductions', header: 'Deductions', render: (r) => formatCurrency(r.deductions) },
          { key: 'overtimePay', header: 'Overtime', render: (r) => formatCurrency(r.overtimePay) },
          { key: 'netSalary', header: 'Net Payable', render: (r) => <span className="font-semibold">{formatCurrency(r.netSalary)}</span> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rows={items}
        actions={(row) => (
          <div className="flex justify-end gap-1">
            {hasPermission('hr.payroll:update') && row.status === 'draft' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setActionTarget(row); setActionNext('processed'); }}
                >
                  Process
                </Button>
                <Button variant="ghost" size="icon" title="Edit" onClick={() => { setEditing(row); setFormOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
            {hasPermission('hr.payroll:update') && row.status === 'processed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setActionTarget(row); setActionNext('paid'); }}
              >
                Mark Paid
              </Button>
            )}
            {hasPermission('hr.payroll:delete') && row.status === 'draft' && (
              <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteTarget(row)}>
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
        title={editing ? 'Edit Payroll (Draft)' : 'New Payroll'}
        fields={editing ? editFields : fields}
        initialValues={
          editing
            ? { ...editing, month: String(editing.month), year: String(editing.year) }
            : null
        }
        onSubmit={(values) => {
          const payload = coerceNumbers(values);
          if (editing) return update(editing.id, payload);
          return create(payload);
        }}
      />

      <EntityFormDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        title="Generate Draft Payrolls"
        description="Creates draft payroll records for every active employee for the selected period. Existing records are skipped."
        fields={generateFields}
        submitLabel="Generate"
        onSubmit={(values) =>
          create(coerceNumbers(values), { path: '/generate', successMessage: 'Draft payroll records generated' })
        }
      />

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={(v) => !v && setActionTarget(null)}
        title={actionNext === 'processed' ? 'Process payroll?' : 'Mark payroll as paid?'}
        description={
          actionNext === 'processed'
            ? `Process payroll for ${actionTarget?.employee?.firstName} ${actionTarget?.employee?.lastName} (${MONTHS[(actionTarget?.month || 1) - 1]} ${actionTarget?.year}). Processed records can no longer be edited.`
            : `Mark payroll for ${actionTarget?.employee?.firstName} ${actionTarget?.employee?.lastName} as paid. This is final.`
        }
        confirmLabel={actionNext === 'processed' ? 'Process' : 'Mark Paid'}
        onConfirm={() =>
          runAction(() => api.patch(`/hr/payroll/${actionTarget.id}/action`, { status: actionNext }), {
            successMessage: `Payroll marked as ${actionNext}`,
          })
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete draft payroll?"
        description={`Delete the draft payroll for ${deleteTarget?.employee?.firstName} ${deleteTarget?.employee?.lastName} (${deleteTarget?.month}/${deleteTarget?.year})? This cannot be undone.`}
        isDestructive
        onConfirm={() => remove(deleteTarget.id)}
      />
    </div>
  );
}
