'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FinancePage() {
  const { hasPermission } = useAuth();
  const expensesRes = useResource('/finance/expenses');
  const invoicesRes = useResource('/finance/invoices');
  const paymentsRes = useResource('/finance/payments');
  const budgetsRes = useResource('/finance/budgets', { page: 1, limit: 100 });
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState('approved');

  useEffect(() => {
    (async () => {
      const [catRes, summaryRes] = await Promise.all([api.get('/finance/expense-categories'), api.get('/finance/summary')]);
      setCategories(catRes.data.data);
      setSummary(summaryRes.data.data);
    })();
  }, []);

  const expenseFields = [
    { name: 'categoryId', label: 'Category', type: 'select', options: categories.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
    { name: 'date', label: 'Date', type: 'date', default: new Date().toISOString().slice(0, 10) },
    { name: 'paidTo', label: 'Paid To' },
    { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: [
      { value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'cheque', label: 'Cheque' }, { value: 'card', label: 'Card' },
    ] },
    { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  ];

  const invoiceFields = [
    { name: 'type', label: 'Type', type: 'select', options: [{ value: 'purchase', label: 'Purchase' }, { value: 'sales', label: 'Sales' }] },
    { name: 'partyName', label: 'Party Name', required: true, fullWidth: true },
    { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
    { name: 'tax', label: 'Tax', type: 'number', step: '0.01' },
    { name: 'issueDate', label: 'Issue Date', type: 'date', default: new Date().toISOString().slice(0, 10) },
    { name: 'dueDate', label: 'Due Date', type: 'date' },
  ];

  const paymentFields = [
    { name: 'invoiceId', label: 'Invoice', type: 'select', options: invoicesRes.items.map((i) => ({ value: i.id, label: i.invoiceNumber })) },
    { name: 'expenseId', label: 'Expense', type: 'select', options: expensesRes.items.map((e) => ({ value: e.id, label: e.expenseNumber })) },
    { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
    { name: 'method', label: 'Method', default: 'bank_transfer' },
    { name: 'reference', label: 'Reference' },
  ];

  const budgetFields = [
    { name: 'category', label: 'Category', required: true, fullWidth: true },
    { name: 'fiscalYear', label: 'Fiscal Year', type: 'number', required: true, default: new Date().getFullYear() },
    { name: 'period', label: 'Period', type: 'select', options: [{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }] },
    { name: 'allocatedAmount', label: 'Allocated Amount', type: 'number', step: '0.01', required: true },
    { name: 'department', label: 'Department' },
  ];

  return (
    <div>
      <PageHeader title="Finance & Accounting" description="Expenses, invoices, payments, and budgets." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <StatCard label="Total Expenses" icon={TrendingDown} value={formatCurrency(summary?.totalExpenses ?? 0)} />
        <StatCard label="Total Paid" icon={Wallet} accent="success" value={formatCurrency(summary?.totalPaid ?? 0)} />
        <StatCard label="Total Invoiced" icon={TrendingUp} value={formatCurrency(summary?.totalInvoiced ?? 0)} />
        <StatCard label="Budget Remaining" icon={PiggyBank} accent="warning" value={formatCurrency(summary?.budget.remaining ?? 0)} />
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <div className="mb-4 flex justify-end">
            {hasPermission('finance.expenses:create') && <Button onClick={() => setExpenseFormOpen(true)}><Plus className="h-4 w-4" /> Submit Expense</Button>}
          </div>
          <DataTable
            isLoading={expensesRes.isLoading}
            columns={[
              { key: 'expenseNumber', header: 'Expense #', render: (r) => <span className="font-mono text-xs">{r.expenseNumber}</span> },
              { key: 'category', header: 'Category', render: (r) => r.category?.name || '—' },
              { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={expensesRes.items}
            actions={
              hasPermission('finance.expenses:approve')
                ? (row) =>
                    row.status === 'pending' && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setActionTarget({ ...row, kind: 'expense' }); setActionType('approved'); }}>
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setActionTarget({ ...row, kind: 'expense' }); setActionType('rejected'); }}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )
                : undefined
            }
          />
          <Pagination meta={expensesRes.meta} onPageChange={(page) => expensesRes.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="invoices">
          <div className="mb-4 flex justify-end">
            {hasPermission('finance.invoices:create') && <Button onClick={() => setInvoiceFormOpen(true)}><Plus className="h-4 w-4" /> New Invoice</Button>}
          </div>
          <DataTable
            isLoading={invoicesRes.isLoading}
            columns={[
              { key: 'invoiceNumber', header: 'Invoice #', render: (r) => <span className="font-mono text-xs">{r.invoiceNumber}</span> },
              { key: 'partyName', header: 'Party' },
              { key: 'totalAmount', header: 'Total', render: (r) => formatCurrency(r.totalAmount) },
              { key: 'dueDate', header: 'Due Date', render: (r) => formatDate(r.dueDate) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={invoicesRes.items}
          />
          <Pagination meta={invoicesRes.meta} onPageChange={(page) => invoicesRes.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="payments">
          <div className="mb-4 flex justify-end">
            {hasPermission('finance.payments:create') && <Button onClick={() => setPaymentFormOpen(true)}><Plus className="h-4 w-4" /> Record Payment</Button>}
          </div>
          <DataTable
            isLoading={paymentsRes.isLoading}
            columns={[
              { key: 'paymentNumber', header: 'Payment #', render: (r) => <span className="font-mono text-xs">{r.paymentNumber}</span> },
              { key: 'target', header: 'For', render: (r) => r.invoice?.invoiceNumber || r.expense?.expenseNumber || '—' },
              { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              { key: 'method', header: 'Method' },
            ]}
            rows={paymentsRes.items}
          />
          <Pagination meta={paymentsRes.meta} onPageChange={(page) => paymentsRes.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="budgets">
          <div className="mb-4 flex justify-end">
            {hasPermission('finance.budgets:create') && <Button onClick={() => setBudgetFormOpen(true)}><Plus className="h-4 w-4" /> New Budget</Button>}
          </div>
          <DataTable
            isLoading={budgetsRes.isLoading}
            columns={[
              { key: 'category', header: 'Category' },
              { key: 'fiscalYear', header: 'FY' },
              { key: 'period', header: 'Period' },
              { key: 'allocatedAmount', header: 'Allocated', render: (r) => formatCurrency(r.allocatedAmount) },
              { key: 'spentAmount', header: 'Spent', render: (r) => formatCurrency(r.spentAmount) },
            ]}
            rows={budgetsRes.items}
          />
        </TabsContent>
      </Tabs>

      <EntityFormDialog open={expenseFormOpen} onOpenChange={setExpenseFormOpen} title="Submit Expense" fields={expenseFields} onSubmit={(values) => expensesRes.create(values)} />
      <EntityFormDialog open={invoiceFormOpen} onOpenChange={setInvoiceFormOpen} title="New Invoice" fields={invoiceFields} onSubmit={(values) => invoicesRes.create(values)} />
      <EntityFormDialog open={paymentFormOpen} onOpenChange={setPaymentFormOpen} title="Record Payment" fields={paymentFields} onSubmit={(values) => paymentsRes.create(values)} />
      <EntityFormDialog open={budgetFormOpen} onOpenChange={setBudgetFormOpen} title="New Budget" fields={budgetFields} onSubmit={(values) => budgetsRes.create(values)} />

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={(v) => !v && setActionTarget(null)}
        title={`${actionType === 'approved' ? 'Approve' : 'Reject'} expense?`}
        isDestructive={actionType === 'rejected'}
        confirmLabel={actionType === 'approved' ? 'Approve' : 'Reject'}
        onConfirm={() => expensesRes.runAction(() => api.patch(`/finance/expenses/${actionTarget.id}/action`, { status: actionType }))}
      />
    </div>
  );
}
