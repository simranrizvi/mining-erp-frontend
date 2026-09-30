import { Badge } from '@/components/ui/badge';
import { toTitleCase } from '@/lib/utils';

const VARIANT_MAP = {
  // success-ish
  active: 'success', approved: 'success', paid: 'success', completed: 'success',
  operational: 'success', received: 'success', present: 'success',
  // warning-ish
  pending: 'warning', under_maintenance: 'warning', partial: 'warning',
  half_day: 'warning', in_progress: 'warning', on_leave: 'warning', draft: 'warning',
  // destructive-ish
  rejected: 'destructive', cancelled: 'destructive', breakdown: 'destructive',
  absent: 'destructive', blacklisted: 'destructive', overdue: 'destructive', terminated: 'destructive',
  // neutral
  retired: 'secondary', inactive: 'secondary', suspended: 'secondary', sent: 'secondary', late: 'warning',
};

export function StatusBadge({ status }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const variant = VARIANT_MAP[status] || 'outline';
  return <Badge variant={variant}>{toTitleCase(status)}</Badge>;
}
