import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        Page <span className="font-medium text-foreground">{meta.page}</span> of{' '}
        <span className="font-medium text-foreground">{meta.totalPages}</span> · {meta.total} total records
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!meta.hasPrevPage} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!meta.hasNextPage} onClick={() => onPageChange(meta.page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
