'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Eye, Pickaxe, CalendarCheck, Boxes, Wallet, Wrench } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toTitleCase } from '@/lib/utils';

const REPORTS = [
  { key: 'production', label: 'Production Report', icon: Pickaxe, endpoint: '/reports/production' },
  { key: 'attendance', label: 'Attendance Report', icon: CalendarCheck, endpoint: '/reports/attendance' },
  { key: 'inventory-valuation', label: 'Inventory Valuation', icon: Boxes, endpoint: '/reports/inventory-valuation' },
  { key: 'financial-summary', label: 'Financial Summary', icon: Wallet, endpoint: '/reports/financial-summary' },
  { key: 'equipment-utilization', label: 'Equipment Utilization', icon: Wrench, endpoint: '/reports/equipment-utilization' },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [active, setActive] = useState(REPORTS[0]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runReport = async () => {
    setIsLoading(true);
    setHasRun(true);
    try {
      const { data } = await api.get(active.endpoint, { params: { from: from || undefined, to: to || undefined } });
      setRows(data.data);
    } catch (err) {
      toast({ title: 'Failed to generate report', description: getErrorMessage(err), variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (format) => {
    try {
      const response = await api.get(active.endpoint, { params: { from: from || undefined, to: to || undefined, format }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${active.key}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast({ title: 'Export failed', description: getErrorMessage(err), variant: 'error' });
    }
  };

  const columns = rows.length ? Object.keys(rows[0]).map((key) => ({ key, header: toTitleCase(key) })) : [];

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Generate and export operational and financial reports." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          const isActive = active.key === report.key;
          return (
            <Card
              key={report.key}
              onClick={() => { setActive(report); setRows([]); setHasRun(false); }}
              className={`cursor-pointer transition-colors ${isActive ? 'border-primary ring-1 ring-primary' : 'hover:bg-accent'}`}
            >
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium">{report.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{active.label}</CardTitle>
          <CardDescription>Optionally filter by date range, then preview or export.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <Label>From</Label>
              <Input type="date" className="mt-1.5 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" className="mt-1.5 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button onClick={runReport}><Eye className="h-4 w-4" /> Preview</Button>
            <Button variant="outline" onClick={() => downloadFile('excel')}><FileSpreadsheet className="h-4 w-4" /> Export Excel</Button>
            <Button variant="outline" onClick={() => downloadFile('pdf')}><FileText className="h-4 w-4" /> Export PDF</Button>
          </div>

          {hasRun && <DataTable isLoading={isLoading} columns={columns} rows={rows} emptyMessage="No data for the selected filters." />}
        </CardContent>
      </Card>
    </div>
  );
}
