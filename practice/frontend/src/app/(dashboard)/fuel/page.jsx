'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatCard } from '@/components/shared/stat-card';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Fuel as FuelIcon, Gauge } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

export default function FuelPage() {
  const { hasPermission } = useAuth();
  const stationsRes = useResource('/fuel/stations', { page: 1, limit: 100 });
  const transactionsRes = useResource('/fuel/transactions');
  const purchasesRes = useResource('/fuel/purchases');
  const [vehicles, setVehicles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [txFormOpen, setTxFormOpen] = useState(false);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [stationFormOpen, setStationFormOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [vRes, eRes] = await Promise.all([api.get('/vehicles?limit=200'), api.get('/equipment?limit=200')]);
      setVehicles(vRes.data.data);
      setEquipment(eRes.data.data);
    })();
  }, []);

  const totalStock = stationsRes.items.reduce((s, st) => s + st.currentStock, 0);

  const txFields = [
    { name: 'fuelStationId', label: 'Fuel Station', type: 'select', required: true, fullWidth: true, options: stationsRes.items.map((s) => ({ value: s.id, label: s.name })) },
    { name: 'vehicleId', label: 'Vehicle (if applicable)', type: 'select', options: vehicles.map((v) => ({ value: v.id, label: v.name })) },
    { name: 'equipmentId', label: 'Equipment (if applicable)', type: 'select', options: equipment.map((e) => ({ value: e.id, label: e.name })) },
    { name: 'quantity', label: 'Quantity (L)', type: 'number', step: '0.01', required: true },
    { name: 'cost', label: 'Cost', type: 'number', step: '0.01', required: true },
    { name: 'odometerReading', label: 'Odometer Reading', type: 'number', step: '0.1' },
    { name: 'purpose', label: 'Purpose', fullWidth: true },
  ];

  const purchaseFields = [
    { name: 'fuelStationId', label: 'Fuel Station', type: 'select', required: true, fullWidth: true, options: stationsRes.items.map((s) => ({ value: s.id, label: s.name })) },
    { name: 'quantity', label: 'Quantity (L)', type: 'number', step: '0.01', required: true },
    { name: 'cost', label: 'Cost', type: 'number', step: '0.01', required: true },
    { name: 'invoiceNumber', label: 'Invoice Number' },
  ];

  const stationFields = [
    { name: 'name', label: 'Station Name', required: true, fullWidth: true },
    { name: 'capacity', label: 'Capacity (L)', type: 'number' },
    { name: 'currentStock', label: 'Current Stock (L)', type: 'number' },
    { name: 'fuelType', label: 'Fuel Type', default: 'diesel' },
  ];

  return (
    <div>
      <PageHeader title="Fuel Management" description="Track fuel stock, issuance, and purchases across mine sites." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Total Fuel Stock" icon={FuelIcon} value={`${formatNumber(totalStock)} L`} />
        <StatCard label="Fuel Stations" icon={Gauge} value={stationsRes.items.length} />
        <StatCard label="Total Issued (cost)" icon={FuelIcon} accent="warning" value={formatCurrency(transactionsRes.meta?.totalCost ?? 0)} />
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <div className="mb-4 flex justify-end">
            {hasPermission('fuel:create') && <Button onClick={() => setTxFormOpen(true)}><Plus className="h-4 w-4" /> Issue Fuel</Button>}
          </div>
          <DataTable
            isLoading={transactionsRes.isLoading}
            columns={[
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              { key: 'station', header: 'Station', render: (r) => r.fuelStation.name },
              { key: 'asset', header: 'Issued To', render: (r) => r.vehicle?.name || r.equipment?.name || '—' },
              { key: 'quantity', header: 'Quantity', render: (r) => `${formatNumber(r.quantity, 2)} L` },
              { key: 'cost', header: 'Cost', render: (r) => formatCurrency(r.cost) },
            ]}
            rows={transactionsRes.items}
          />
          <Pagination meta={transactionsRes.meta} onPageChange={(page) => transactionsRes.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="purchases">
          <div className="mb-4 flex justify-end">
            {hasPermission('fuel:create') && <Button onClick={() => setPurchaseFormOpen(true)}><Plus className="h-4 w-4" /> Record Purchase</Button>}
          </div>
          <DataTable
            isLoading={purchasesRes.isLoading}
            columns={[
              { key: 'purchaseDate', header: 'Date', render: (r) => formatDate(r.purchaseDate) },
              { key: 'station', header: 'Station', render: (r) => r.fuelStation.name },
              { key: 'quantity', header: 'Quantity', render: (r) => `${formatNumber(r.quantity, 2)} L` },
              { key: 'cost', header: 'Cost', render: (r) => formatCurrency(r.cost) },
              { key: 'invoiceNumber', header: 'Invoice #', render: (r) => r.invoiceNumber || '—' },
            ]}
            rows={purchasesRes.items}
          />
          <Pagination meta={purchasesRes.meta} onPageChange={(page) => purchasesRes.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="stations">
          <div className="mb-4 flex justify-end">
            {hasPermission('fuel:create') && <Button onClick={() => setStationFormOpen(true)}><Plus className="h-4 w-4" /> New Station</Button>}
          </div>
          <DataTable
            isLoading={stationsRes.isLoading}
            columns={[
              { key: 'name', header: 'Station', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'fuelType', header: 'Fuel Type' },
              { key: 'currentStock', header: 'Current Stock', render: (r) => `${formatNumber(r.currentStock)} L` },
              { key: 'capacity', header: 'Capacity', render: (r) => `${formatNumber(r.capacity)} L` },
            ]}
            rows={stationsRes.items}
          />
        </TabsContent>
      </Tabs>

      <EntityFormDialog open={txFormOpen} onOpenChange={setTxFormOpen} title="Issue Fuel" fields={txFields} onSubmit={(values) => transactionsRes.create(values)} />
      <EntityFormDialog open={purchaseFormOpen} onOpenChange={setPurchaseFormOpen} title="Record Fuel Purchase" fields={purchaseFields} onSubmit={(values) => purchasesRes.create(values)} />
      <EntityFormDialog open={stationFormOpen} onOpenChange={setStationFormOpen} title="New Fuel Station" fields={stationFields} onSubmit={(values) => stationsRes.create(values)} />
    </div>
  );
}
