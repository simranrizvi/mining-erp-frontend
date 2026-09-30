'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) return setError('New passwords do not match.');
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => logout(), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Change Password" description="Update your account password. You'll be signed out afterwards for security." />
      <Card className="max-w-md">
        <CardContent className="p-5">
          {success ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <KeyRound className="h-4 w-4" /> Password changed successfully. Signing you out...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" required className="mt-1.5" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" required minLength={8} className="mt-1.5" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">At least 8 characters, with uppercase, lowercase, and a number.</p>
              </div>
              <div>
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" type="password" required className="mt-1.5" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
