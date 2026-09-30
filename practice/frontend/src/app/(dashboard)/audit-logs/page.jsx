'use client';

import { useResource } from '@/hooks/use-resource';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatDateTime, toTitleCase } from '@/lib/utils';

const ACTION_COLORS = {
  CREATE: 'success', UPDATE: 'warning', DELETE: 'destructive', LOGIN: 'secondary', LOGOUT: 'secondary', APPROVE: 'success', REJECT: 'destructive',
};

export default function AuditLogsPage() {
  const { items, meta, params, updateParams, isLoading } = useResource('/audit-logs');

  return (
    <div>
      <PageHeader title="Audit Logs" description="A complete, tamper-evident trail of every meaningful action in the system." />

      <div className="mb-4">
        <Select value={params.action || 'all'} onValueChange={(v) => updateParams({ action: v === 'all' ? '' : v })}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {Object.keys(ACTION_COLORS).map((a) => <SelectItem key={a} value={a}>{toTitleCase(a)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'createdAt', header: 'Timestamp', render: (r) => formatDateTime(r.createdAt) },
          { key: 'user', header: 'User', render: (r) => r.user?.name || 'System' },
          { key: 'action', header: 'Action', render: (r) => <Badge variant={ACTION_COLORS[r.action] || 'outline'}>{toTitleCase(r.action)}</Badge> },
          { key: 'module', header: 'Module', render: (r) => toTitleCase(r.module) },
          { key: 'description', header: 'Description' },
          { key: 'ipAddress', header: 'IP Address', render: (r) => <span className="font-mono text-xs">{r.ipAddress || '—'}</span> },
        ]}
        rows={items}
      />
      <Pagination meta={meta} onPageChange={(page) => updateParams({ page })} />
    </div>
  );
}
