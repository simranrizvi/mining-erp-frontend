'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Pickaxe, MapPin, CalendarClock, Activity } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatNumber, toTitleCase } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [overviewRes, trendRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/production-trend?days=14'),
        ]);
        setOverview(overviewRes.data.data);
        setTrend(trendRes.data.data.map((d) => ({ ...d, label: d.date.slice(5) })));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`} description="Here's what's happening across your operations today." />

      {error && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Mine Sites"
          icon={MapPin}
          value={isLoading ? '—' : `${overview?.mineSites.active ?? 0} / ${overview?.mineSites.total ?? 0}`}
          hint="Active vs total sites"
        />
        <StatCard
          label="Active Employees"
          icon={Users}
          accent="success"
          value={isLoading ? '—' : formatNumber(overview?.employees.active ?? 0)}
          hint={`${formatNumber(overview?.employees.total ?? 0)} total headcount`}
        />
        <StatCard
          label="Production Today"
          icon={Pickaxe}
          accent="warning"
          value={isLoading ? '—' : `${formatNumber(overview?.production.today ?? 0)}`}
          hint={`${formatNumber(overview?.production.monthToDate ?? 0)} month-to-date`}
        />
        <StatCard
          label="Pending Leave Requests"
          icon={CalendarClock}
          accent="destructive"
          value={isLoading ? '—' : formatNumber(overview?.pendingLeaveRequests ?? 0)}
          hint="Awaiting approval"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Production Trend</CardTitle>
            <CardDescription>Total quantity extracted across all sites, last 14 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }}
                  />
                  <Line type="monotone" dataKey="quantity" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}

            {!isLoading && overview?.recentActivity?.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            )}

            {!isLoading &&
              overview?.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Activity className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{activity.user}</span>{' '}
                      <span className="text-muted-foreground">{activity.description || toTitleCase(activity.action)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
