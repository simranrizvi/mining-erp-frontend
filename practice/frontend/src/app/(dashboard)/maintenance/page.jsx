'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';

function assetOptions(equipment, vehicles) {
  return [
    ...equipment.map((e) => ({ value: `equipment:${e.id}`, label: `🔧 ${e.name} (${e.code})` })),
    ...vehicles.map((v) => ({ value: `vehicle:${v.id}`, label: `🚚 ${v.name} (${v.plateNumber})` })),
  ];
}
function splitAsset(value) {
  const [kind, id] = value.split(':');
  return kind === 'equipment' ? { equipmentId: id, vehicleId: null } : { equipmentId: null, vehicleId: id };
}

export default function MaintenancePage() {
  const { hasPermission } = useAuth();
  const schedules = useResource('/maintenance/schedules');
  const records = useResource('/maintenance/records');
  const [equipment, setEquipment] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [recordFormOpen, setRecordFormOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [eqRes, vRes] = await Promise.all([api.get('/equipment?limit=200'), api.get('/vehicles?limit=200')]);
      setEquipment(eqRes.data.data);
      setVehicles(vRes.data.data);
    })();
  }, []);

  const assetOpts = assetOptions(equipment, vehicles);

  const scheduleFields = [
    { name: 'asset', label: 'Asset', type: 'select', required: true, fullWidth: true, options: assetOpts },
    { name: 'type', label: 'Type', type: 'select', options: [{ value: 'preventive', label: 'Preventive' }, { value: 'corrective', label: 'Corrective' }] },
    { name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
    { name: 'frequencyDays', label: 'Repeat every (days)', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  ];

  const recordFields = [
    { name: 'asset', label: 'Asset', type: 'select', required: true, fullWidth: true, options: assetOpts },
    { name: 'maintenanceType', label: 'Type', default: 'preventive' },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
    { name: 'endDate', label: 'End Date', type: 'date' },
    { name: 'cost', label: 'Cost', type: 'number', step: '0.01' },
    { name: 'downtimeHours', label: 'Downtime (hours)', type: 'number', step: '0.1' },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }] },
    { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  ];

  return (
    <div>
      <PageHeader title="Maintenance" description="Schedule and track preventive and corrective maintenance." />

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Maintenance Records</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <div className="mb-4 flex justify-end">
            {hasPermission('maintenance:create') && (
              <Button onClick={() => setRecordFormOpen(true)}><Plus className="h-4 w-4" /> Log Maintenance</Button>
            )}
          </div>
          <DataTable
            isLoading={records.isLoading}
            columns={[
              { key: 'asset', header: 'Asset', render: (r) => r.equipment?.name || r.vehicle?.name || '—' },
              { key: 'maintenanceType', header: 'Type' },
              { key: 'startDate', header: 'Start', render: (r) => formatDate(r.startDate) },
              { key: 'endDate', header: 'End', render: (r) => formatDate(r.endDate) },
              { key: 'cost', header: 'Cost', render: (r) => formatCurrency(r.cost) },
              { key: 'downtimeHours', header: 'Downtime (hrs)' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={records.items}
          />
          <Pagination meta={records.meta} onPageChange={(page) => records.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="schedules">
          <div className="mb-4 flex justify-end">
            {hasPermission('maintenance:create') && (
              <Button onClick={() => setScheduleFormOpen(true)}><Plus className="h-4 w-4" /> New Schedule</Button>
            )}
          </div>
          <DataTable
            isLoading={schedules.isLoading}
            columns={[
              { key: 'asset', header: 'Asset', render: (r) => r.equipment?.name || r.vehicle?.name || '—' },
              { key: 'type', header: 'Type' },
              { key: 'scheduledDate', header: 'Scheduled Date', render: (r) => formatDate(r.scheduledDate) },
              { key: 'frequencyDays', header: 'Repeats (days)', render: (r) => r.frequencyDays || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={schedules.items}
          />
          <Pagination meta={schedules.meta} onPageChange={(page) => schedules.updateParams({ page })} />
        </TabsContent>
      </Tabs>

      <EntityFormDialog
        open={recordFormOpen}
        onOpenChange={setRecordFormOpen}
        title="Log Maintenance Record"
        fields={recordFields}
        onSubmit={(values) => {
          const { asset, ...rest } = values;
          return records.create({ ...rest, ...splitAsset(asset) });
        }}
      />

      <EntityFormDialog
        open={scheduleFormOpen}
        onOpenChange={setScheduleFormOpen}
        title="New Maintenance Schedule"
        fields={scheduleFields}
        onSubmit={(values) => {
          const { asset, ...rest } = values;
          return schedules.create({ ...rest, ...splitAsset(asset) }, { path: '' });
        }}
      />
    </div>
  );
}
