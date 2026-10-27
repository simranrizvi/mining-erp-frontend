import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({ label, value, icon: Icon, accent = 'primary', hint }) {
  return (
    <Card className="hazard-corner overflow-hidden">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums truncate">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
              accent === 'primary' && 'bg-primary/10 text-primary',
              accent === 'success' && 'bg-success/10 text-success',
              accent === 'warning' && 'bg-warning/10 text-warning-foreground',
              accent === 'destructive' && 'bg-destructive/10 text-destructive'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
