'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/ui/toaster';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [savingCompany, setSavingCompany] = useState(false);
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [leaveTypeFormOpen, setLeaveTypeFormOpen] = useState(false);
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAll = async () => {
    const [companyRes, deptRes, ltRes, shiftRes] = await Promise.all([
      api.get('/settings/company'), api.get('/settings/departments'), api.get('/settings/leave-types'), api.get('/settings/shifts'),
    ]);
    setCompany(companyRes.data.data);
    setDepartments(deptRes.data.data);
    setLeaveTypes(ltRes.data.data);
    setShifts(shiftRes.data.data);
  };
  useEffect(() => { loadAll(); }, []);

  const saveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await api.patch('/settings/company', {
        name: company.name, address: company.address, phone: company.phone, email: company.email, currency: company.currency, timezone: company.timezone,
      });
      toast({ title: 'Company profile saved', variant: 'success' });
    } catch (err) {
      toast({ title: 'Save failed', description: getErrorMessage(err), variant: 'error' });
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <div>
      <PageHeader title="System Settings" description="Company profile and HR master data configuration." />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="max-w-2xl">
            <CardContent className="p-5">
              {company && (
                <form onSubmit={saveCompany} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Company Name</Label>
                    <Input className="mt-1.5" value={company.name || ''} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input className="mt-1.5" value={company.phone || ''} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input className="mt-1.5" value={company.email || ''} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Address</Label>
                    <Input className="mt-1.5" value={company.address || ''} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input className="mt-1.5" value={company.currency || ''} onChange={(e) => setCompany({ ...company, currency: e.target.value.toUpperCase() })} maxLength={3} />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Input className="mt-1.5" value={company.timezone || ''} onChange={(e) => setCompany({ ...company, timezone: e.target.value })} />
                  </div>
                  {hasPermission('settings:update') && (
                    <div className="sm:col-span-2">
                      <Button type="submit" disabled={savingCompany}><Save className="h-4 w-4" /> Save Changes</Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <div className="mb-4 flex justify-end">
            {hasPermission('settings:create') && <Button onClick={() => setDeptFormOpen(true)}><Plus className="h-4 w-4" /> New Department</Button>}
          </div>
          <DataTable
            isLoading={false}
            columns={[{ key: 'name', header: 'Department' }, { key: 'code', header: 'Code' }]}
            rows={departments}
            actions={hasPermission('settings:delete') ? (row) => (
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: 'departments', ...row })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : undefined}
          />
        </TabsContent>

        <TabsContent value="leave-types">
          <div className="mb-4 flex justify-end">
            {hasPermission('settings:create') && <Button onClick={() => setLeaveTypeFormOpen(true)}><Plus className="h-4 w-4" /> New Leave Type</Button>}
          </div>
          <DataTable
            isLoading={false}
            columns={[{ key: 'name', header: 'Leave Type' }, { key: 'maxDaysPerYear', header: 'Max Days / Year' }]}
            rows={leaveTypes}
            actions={hasPermission('settings:delete') ? (row) => (
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: 'leave-types', ...row })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : undefined}
          />
        </TabsContent>

        <TabsContent value="shifts">
          <div className="mb-4 flex justify-end">
            {hasPermission('settings:create') && <Button onClick={() => setShiftFormOpen(true)}><Plus className="h-4 w-4" /> New Shift</Button>}
          </div>
          <DataTable
            isLoading={false}
            columns={[{ key: 'name', header: 'Shift' }, { key: 'startTime', header: 'Start' }, { key: 'endTime', header: 'End' }, { key: 'mineSite', header: 'Mine Site', render: (r) => r.mineSite?.name || '—' }]}
            rows={shifts}
            actions={hasPermission('settings:delete') ? (row) => (
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: 'shifts', ...row })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : undefined}
          />
        </TabsContent>
      </Tabs>

      <EntityFormDialog
        open={deptFormOpen} onOpenChange={setDeptFormOpen} title="New Department"
        fields={[{ name: 'name', label: 'Department Name', required: true, fullWidth: true }]}
        onSubmit={async (values) => { await api.post('/settings/departments', values); await loadAll(); }}
      />
      <EntityFormDialog
        open={leaveTypeFormOpen} onOpenChange={setLeaveTypeFormOpen} title="New Leave Type"
        fields={[{ name: 'name', label: 'Leave Type Name', required: true, fullWidth: true }, { name: 'maxDaysPerYear', label: 'Max Days / Year', type: 'number' }]}
        onSubmit={async (values) => { await api.post('/settings/leave-types', values); await loadAll(); }}
      />
      <EntityFormDialog
        open={shiftFormOpen} onOpenChange={setShiftFormOpen} title="New Shift"
        fields={[
          { name: 'name', label: 'Shift Name', required: true, fullWidth: true },
          { name: 'startTime', label: 'Start Time (HH:MM)', required: true, placeholder: '06:00' },
          { name: 'endTime', label: 'End Time (HH:MM)', required: true, placeholder: '18:00' },
        ]}
        onSubmit={async (values) => { await api.post('/settings/shifts', values); await loadAll(); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        onConfirm={async () => {
          await api.delete(`/settings/${deleteTarget.type}/${deleteTarget.id}`);
          toast({ title: 'Deleted', variant: 'success' });
          await loadAll();
        }}
      />
    </div>
  );
}
