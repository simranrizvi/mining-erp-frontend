'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, X, PackageCheck } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useAuth } from '@/context/auth-context';
import { api, getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LineItemsEditor } from '@/components/shared/line-items-editor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ProcurementPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const vendorsRes = useResource('/procurement/vendors');
  const requestsRes = useResource('/procurement/requests');
  const ordersRes = useResource('/procurement/orders');

  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [requestItems, setRequestItems] = useState([{ description: '', quantity: '', estimatedCost: '' }]);
  const [orderItems, setOrderItems] = useState([{ description: '', quantity: '', unitPrice: '' }]);
  const [orderVendorId, setOrderVendorId] = useState('');
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState('approved');
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [receiveQty, setReceiveQty] = useState({});

  const vendorFields = [
    { name: 'name', label: 'Vendor Name', required: true, fullWidth: true },
    { name: 'contactPerson', label: 'Contact Person' },
    { name: 'phone', label: 'Phone' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'category', label: 'Category' },
    { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
  ];

  return (
    <div>
      <PageHeader title="Procurement" description="Vendors, purchase requests, and purchase orders." />

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="mb-4 flex justify-end">
            {hasPermission('procurement:create') && (
              <Button onClick={() => { setRequestItems([{ description: '', quantity: '', estimatedCost: '' }]); setRequestFormOpen(true); }}>
                <Plus className="h-4 w-4" /> New Request
              </Button>
            )}
          </div>
          <DataTable
            isLoading={requestsRes.isLoading}
            columns={[
              { key: 'requestNumber', header: 'Request #', render: (r) => <span className="font-mono text-xs">{r.requestNumber}</span> },
              { key: 'items', header: 'Items', render: (r) => `${r.items.length} item(s)` },
              { key: 'requiredDate', header: 'Required By', render: (r) => formatDate(r.requiredDate) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={requestsRes.items}
            actions={
              hasPermission('procurement:approve')
                ? (row) =>
                    row.status === 'pending' && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setActionTarget(row); setActionType('approved'); }}>
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setActionTarget(row); setActionType('rejected'); }}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )
                : undefined
            }
          />
          <Pagination meta={requestsRes.meta} onPageChange={(page) => requestsRes.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="orders">
          <div className="mb-4 flex justify-end">
            {hasPermission('procurement:create') && (
              <Button onClick={() => { setOrderItems([{ description: '', quantity: '', unitPrice: '' }]); setOrderVendorId(''); setOrderFormOpen(true); }}>
                <Plus className="h-4 w-4" /> New Purchase Order
              </Button>
            )}
          </div>
          <DataTable
            isLoading={ordersRes.isLoading}
            columns={[
              { key: 'poNumber', header: 'PO #', render: (r) => <span className="font-mono text-xs">{r.poNumber}</span> },
              { key: 'vendor', header: 'Vendor', render: (r) => r.vendor.name },
              { key: 'totalAmount', header: 'Total', render: (r) => formatCurrency(r.totalAmount) },
              { key: 'orderDate', header: 'Order Date', render: (r) => formatDate(r.orderDate) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={ordersRes.items}
            actions={
              hasPermission('procurement:update')
                ? (row) =>
                    ['sent', 'partial'].includes(row.status) && (
                      <Button variant="ghost" size="icon" onClick={() => { setReceiveTarget(row); setReceiveQty({}); }} title="Receive goods">
                        <PackageCheck className="h-4 w-4 text-primary" />
                      </Button>
                    )
                : undefined
            }
          />
          <Pagination meta={ordersRes.meta} onPageChange={(page) => ordersRes.updateParams({ page })} />
        </TabsContent>

        <TabsContent value="vendors">
          <div className="mb-4 flex justify-end">
            {hasPermission('vendors:create') && <Button onClick={() => setVendorFormOpen(true)}><Plus className="h-4 w-4" /> New Vendor</Button>}
          </div>
          <DataTable
            isLoading={vendorsRes.isLoading}
            columns={[
              { key: 'name', header: 'Vendor', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'contactPerson', header: 'Contact', render: (r) => r.contactPerson || '—' },
              { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
              { key: 'category', header: 'Category', render: (r) => r.category || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={vendorsRes.items}
          />
          <Pagination meta={vendorsRes.meta} onPageChange={(page) => vendorsRes.updateParams({ page })} />
        </TabsContent>
      </Tabs>

      <EntityFormDialog open={vendorFormOpen} onOpenChange={setVendorFormOpen} title="New Vendor" fields={vendorFields} onSubmit={(values) => vendorsRes.create(values)} />

      {/* Purchase Request — custom dialog with line items */}
      <Dialog open={requestFormOpen} onOpenChange={setRequestFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Purchase Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <LineItemsEditor
              columns={[
                { key: 'description', label: 'Description', width: 'flex-[2]' },
                { key: 'quantity', label: 'Qty', type: 'number', width: 'w-20' },
                { key: 'estimatedCost', label: 'Est. Cost', type: 'number', width: 'w-28' },
              ]}
              rows={requestItems}
              onChange={setRequestItems}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestFormOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await requestsRes.create({
                    items: requestItems
                      .filter((i) => i.description && i.quantity)
                      .map((i) => ({ description: i.description, quantity: Number(i.quantity), estimatedCost: Number(i.estimatedCost) || 0 })),
                  });
                  setRequestFormOpen(false);
                } catch (err) {
                  toast({ title: 'Could not submit request', description: getErrorMessage(err), variant: 'error' });
                }
              }}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Order — custom dialog with vendor + line items */}
      <Dialog open={orderFormOpen} onOpenChange={setOrderFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vendor</Label>
              <Select value={orderVendorId} onValueChange={setOrderVendorId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                <SelectContent>
                  {vendorsRes.items.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <LineItemsEditor
              columns={[
                { key: 'description', label: 'Description', width: 'flex-[2]' },
                { key: 'quantity', label: 'Qty', type: 'number', width: 'w-20' },
                { key: 'unitPrice', label: 'Unit Price', type: 'number', width: 'w-28' },
              ]}
              rows={orderItems}
              onChange={setOrderItems}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderFormOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!orderVendorId) return toast({ title: 'Select a vendor first', variant: 'error' });
                try {
                  await ordersRes.create({
                    vendorId: orderVendorId,
                    items: orderItems
                      .filter((i) => i.description && i.quantity && i.unitPrice)
                      .map((i) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
                  });
                  setOrderFormOpen(false);
                } catch (err) {
                  toast({ title: 'Could not create order', description: getErrorMessage(err), variant: 'error' });
                }
              }}
            >
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={(v) => !v && setActionTarget(null)}
        title={`${actionType === 'approved' ? 'Approve' : 'Reject'} purchase request?`}
        isDestructive={actionType === 'rejected'}
        confirmLabel={actionType === 'approved' ? 'Approve' : 'Reject'}
        onConfirm={() => requestsRes.runAction(() => api.patch(`/procurement/requests/${actionTarget.id}/action`, { status: actionType }))}
      />

      {/* Receive goods against a PO */}
      <Dialog open={!!receiveTarget} onOpenChange={(v) => !v && setReceiveTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Receive Goods — {receiveTarget?.poNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {receiveTarget?.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground">Ordered: {item.quantity} · Received: {item.receivedQuantity}</p>
                </div>
                <input
                  type="number"
                  className="h-9 w-24 rounded-md border border-input px-2 text-sm"
                  placeholder="Qty"
                  max={item.quantity - item.receivedQuantity}
                  onChange={(e) => setReceiveQty((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                const receipts = Object.entries(receiveQty)
                  .filter(([, v]) => Number(v) > 0)
                  .map(([purchaseOrderItemId, v]) => ({ purchaseOrderItemId, receivedQuantity: Number(v) }));
                if (!receipts.length) return toast({ title: 'Enter at least one quantity', variant: 'error' });
                await ordersRes.runAction(() => api.post(`/procurement/orders/${receiveTarget.id}/receive`, { receipts }), { successMessage: 'Goods received' });
                setReceiveTarget(null);
              }}
            >
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
