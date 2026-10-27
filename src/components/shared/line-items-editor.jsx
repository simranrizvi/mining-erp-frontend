'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Repeating line-item editor used by Purchase Requests and Purchase Orders,
 * where the API expects an `items: [...]` array rather than flat fields.
 * `columns` describes each editable field per row: { key, label, type, width }.
 */
export function LineItemsEditor({ columns, rows, onChange, addLabel = 'Add Line Item' }) {
  const updateRow = (idx, key, value) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], [key]: value };
    onChange(next);
  };
  const addRow = () => onChange([...rows, Object.fromEntries(columns.map((c) => [c.key, c.default ?? '']))]);
  const removeRow = (idx) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div>
      <Label>Line Items</Label>
      <div className="mt-1.5 space-y-2 rounded-md border border-border p-3">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-end gap-2">
            {columns.map((col) => (
              <div key={col.key} className={col.width || 'flex-1'}>
                <p className="mb-1 text-[11px] text-muted-foreground">{col.label}</p>
                <Input
                  type={col.type || 'text'}
                  step={col.step}
                  value={row[col.key] ?? ''}
                  onChange={(e) => updateRow(idx, col.key, e.target.value)}
                  placeholder={col.placeholder}
                />
              </div>
            ))}
            <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(idx)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4" /> {addLabel}
        </Button>
      </div>
    </div>
  );
}
