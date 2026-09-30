'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, ArrowUpDown } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { StatCard } from '@/components/shared/stat-card';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Boxes, PackageMinus } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const itemsRes = useResource('/inventory/items');
  const warehousesRes = useResource('/inventory/warehouses', { page: 1, limit: 100 });
  const [categories, setCategories] = useState([]);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [warehouseFormOpen, setWarehouseFormOpen] = useState(false);
  const [movementTarget, setMovementTarget] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const loadCategories = async () => {
    const { data } = await api.get('/inventory/categories');
    setCategories(data.data);
  };
  useEffect(() => { loadCategories(); }, []);

  const itemFields = [
    { name: 'sku', label: 'SKU', required: true },
    { name: 'name', label: 'Item Name', required: true },
    { name: 'categoryId', label: 'Category', type: 'select', options: categories.map((c) => ({ value: c.id, label: c.name })) },
    { name: 'warehouseId', label: 'Warehouse', type: 'select', options: warehousesRes.items.map((w) => ({ value: w.id, label: w.name })) },
    { name: 'unit', label: 'Unit', default: 'pcs' },
    { name: 'quantityInStock', label: 'Opening Stock', type: 'number', step: '0.01' },
    { name: 'reorderLevel', label: 'Reorder Level', type: 'number', step: '0.01' },
    { name: 'unitPrice', label: 'Unit Price', type: 'number', step: '0.01' },
  ];

  const warehouseFields = [
    { name: 'name', label: 'Warehouse Name', required: true, fullWidth: true },
    { name: 'location', label: 'Location', fullWidth: true },
    { name: 'capacity', label: 'Capacity', type: 'number' },
  ];

  const movementFields = [
    { name: 'type', label: 'Movement Type', type: 'select', required: true, options: [{ value: 'in', label: 'Stock In' }, { value: 'out', label: 'Stock Out' }, { value: 'adjustment', label: 'Adjustment' }] },
    { name: 'quantity', label: 'Quantity', type: 'number', step: '0.01', required: true },
    { name: 'reference', label: 'Reference (PO#, requisition, etc.)' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', fullWidth: true },
  ];

  return (
    <div>
      <PageHeader title="Inventory" description="Track stock levels, warehouses, and item categories." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Total Items" icon={Boxes} value={itemsRes.meta?.total ?? '—'} />
        <StatCard label="Total Stock Units" icon={Boxes} value={formatNumber(itemsRes.meta?.totalStockUnits ?? 0)} />
        <StatCard
          label="Low Stock Items"
          icon={PackageMinus}
          accent="warning"
          value={itemsRes.items.filter((i) => i.quantityInStock <= i.reorderLevel).length}
        />
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="mb-4 flex items-center justify-between">
            <SearchInput onSearch={(search) => itemsRes.updateParams({ search })} placeholder="Search by name or SKU..." />
            {hasPermission('inventory:create') && (
              <Button onClick={() => { setEditingItem(null); setItemFormOpen(true); }}><Plus className="h-4 w-4" /> New Item</Button>
            )}
          </div>
          <DataTable
            isLoading={itemsRes.isLoading}
            columns={[
              { key: 'sku', header: 'SKU', render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
              { key: 'name', header: 'Item', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'category', header: 'Category', render: (r) => r.category?.name || '—' },
              { key: 'warehouse', header: 'Warehouse', render: (r) => r.warehouse?.name || '—' },
              {
                key: 'quantityInStock', header: 'Stock',
                render: (r) => (
                  <span className="flex items-center gap-1.5">
                    {formatNumber(r.quantityInStock, 2)} {r.unit}
                    {r.quantityInStock <= r.reorderLevel && <Badge variant="warning">Low</Badge>}
                  </span>
                ),
              },
              { key: 'unitPrice', header: 'Unit Price', render: (r) => formatCurrency(r.unitPrice) },
            ]}
            rows={itemsRes.items}
            actions={(row) => (
              <div className="flex justify-end gap-1">
                {hasPermission('inventory:update') && (
                  <Button variant="ghost" size="icon" onClick={() => setMovementTarget(row)} title="Record stock movement">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                )}
                {hasPermission('inventory:update') && (
                  <Button variant="ghost" size="icon" onClick={() => { setEditingItem(row); setItemFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          />
          <Pagination meta={itemsRes.meta} onPageChange={(page) => itemsRes.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="warehouses">
          <div className="mb-4 flex justify-end">
            {hasPermission('inventory:create') && (
              <Button onClick={() => setWarehouseFormOpen(true)}><Plus className="h-4 w-4" /> New Warehouse</Button>
            )}
          </div>
          <DataTable
            isLoading={warehousesRes.isLoading}
            columns={[
              { key: 'name', header: 'Warehouse', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'location', header: 'Location', render: (r) => r.location || '—' },
              { key: 'items', header: 'Items Stored', render: (r) => r._count?.items ?? 0 },
              { key: 'capacity', header: 'Capacity', render: (r) => r.capacity || '—' },
            ]}
            rows={warehousesRes.items}
          />
        </TabsContent>
      </Tabs>

      <EntityFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        title={editingItem ? 'Edit Item' : 'New Inventory Item'}
        fields={itemFields}
        initialValues={editingItem ? { ...editingItem, categoryId: editingItem.category?.id, warehouseId: editingItem.warehouse?.id } : null}
        onSubmit={(values) => (editingItem ? itemsRes.update(editingItem.id, values) : itemsRes.create(values))}
      />

      <EntityFormDialog open={warehouseFormOpen} onOpenChange={setWarehouseFormOpen} title="New Warehouse" fields={warehouseFields} onSubmit={(values) => warehousesRes.create(values)} />

      <EntityFormDialog
        open={!!movementTarget}
        onOpenChange={(v) => !v && setMovementTarget(null)}
        title={`Record Stock Movement — ${movementTarget?.name}`}
        fields={movementFields}
        onSubmit={async (values) => {
          await api.post('/inventory/movements', { itemId: movementTarget.id, ...values });
          await itemsRes.refetch();
        }}
      />
    </div>
  );
}
