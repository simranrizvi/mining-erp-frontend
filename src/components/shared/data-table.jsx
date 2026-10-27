import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox } from 'lucide-react';

/**
 * Generic table renderer used across every module. `columns` is an array of
 * { key, header, render?(row) } — pass `render` for computed/formatted cells,
 * otherwise the raw field at `key` is shown.
 */
export function DataTable({ columns, rows, isLoading, emptyMessage = 'No records found.', actions }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.header}</TableHead>
            ))}
            {actions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                )}
              </TableRow>
            ))}

          {!isLoading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Inbox className="h-8 w-8 opacity-40" />
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            rows.map((row, idx) => (
              <TableRow key={row.id || idx}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </TableCell>
                ))}
                {actions && <TableCell className="text-right">{actions(row)}</TableCell>}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
