'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mountain, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [isLoading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, hsl(28 85% 55%) 0, hsl(28 85% 55%) 2px, transparent 2px, transparent 40px)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
<div className="relative flex items-center gap-2.5">
  <img 
    src="/logo.png" 
    alt="Atlas Mining Logo" 
    className="h-[100px] object-contain" 
  />
</div>
 
</div>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            One platform for the entire mining operation.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/60">
            Employees, mine sites, production, equipment, inventory, procurement, fuel, and finance —
            unified in a single, secure, real-time system.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/40">© {new Date().getFullYear()} Atlas Mining Corporation</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <Mountain className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-semibold">ATLAS MINING</span>
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to access the ERP dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
              />
            </div>

            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Default administrator: <span className="font-mono">admin@miningerp.com</span> — set via your seed script.
          </p>
        </div>
      </div>
    </div>
  );
}
