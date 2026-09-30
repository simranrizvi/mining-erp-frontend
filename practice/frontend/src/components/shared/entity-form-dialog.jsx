'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getErrorMessage, getFieldErrors } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

function buildInitialValues(fields, initialValues) {
  const values = {};
  fields.forEach((f) => {
    if (initialValues && initialValues[f.name] !== undefined) {
      values[f.name] = f.type === 'date' && initialValues[f.name] ? String(initialValues[f.name]).slice(0, 10) : initialValues[f.name];
    } else {
      values[f.name] = f.default ?? (f.type === 'checkbox' ? false : '');
    }
  });
  return values;
}

/**
 * A schema-driven create/edit form rendered inside a Dialog. Every module
 * page (Employees, Equipment, Vendors, Expenses, ...) passes its own
 * `fields` definition into this single component instead of hand-rolling a
 * bespoke form — keeping every page fully functional with far less code.
 */
export function EntityFormDialog({ open, onOpenChange, title, description, fields, initialValues, onSubmit, submitLabel = 'Save' }) {
  const [values, setValues] = useState(() => buildInitialValues(fields, initialValues));
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setValues(buildInitialValues(fields, initialValues));
      setFieldErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      const errors = getFieldErrors(err);
      if (errors.length) {
        const map = {};
        errors.forEach((fe) => {
          map[fe.field] = fe.message;
        });
        setFieldErrors(map);
      }
      toast({ title: 'Could not save', description: getErrorMessage(err), variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>

              <div className="mt-1.5">
                {field.type === 'textarea' && (
                  <Textarea
                    id={field.name}
                    value={values[field.name] ?? ''}
                    onChange={(e) => setField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}

                {field.type === 'select' && (
                  <Select value={values[field.name] ? String(values[field.name]) : ''} onValueChange={(v) => setField(field.name, v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options || []).map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === 'checkbox' && (
                  <div className="flex h-9 items-center gap-2">
                    <Checkbox
                      id={field.name}
                      checked={!!values[field.name]}
                      onCheckedChange={(checked) => setField(field.name, checked === true)}
                    />
                    <span className="text-sm text-muted-foreground">{field.checkboxLabel || 'Enabled'}</span>
                  </div>
                )}

                {!['textarea', 'select', 'checkbox'].includes(field.type) && (
                  <Input
                    id={field.name}
                    type={field.type || 'text'}
                    step={field.step}
                    min={field.min}
                    value={values[field.name] ?? ''}
                    onChange={(e) => setField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
              {fieldErrors[field.name] && <p className="mt-1 text-xs text-destructive">{fieldErrors[field.name]}</p>}
            </div>
          ))}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
