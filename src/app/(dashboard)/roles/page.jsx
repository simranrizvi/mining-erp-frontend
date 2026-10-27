'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/ui/toaster';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toTitleCase } from '@/lib/utils';

const ACTIONS = ['create', 'read', 'update', 'delete', 'approve', 'export'];

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, catalogRes] = await Promise.all([api.get('/roles'), api.get('/roles/permissions/catalog')]);
      setRoles(rolesRes.data.data);
      setCatalog(catalogRes.data.data);
    } catch (err) {
      toast({ title: 'Failed to load roles', description: getErrorMessage(err), variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPermissionEditor = (role) => {
    setEditingRole(role);
    setSelectedKeys(new Set(role.permissions.map((p) => p.key)));
  };

  const togglePermission = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleModule = (moduleKey, allKeys, checked) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      allKeys.forEach((k) => (checked ? next.add(k) : next.delete(k)));
      return next;
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const allPerms = Object.values(catalog).flat();
      const permissionIds = allPerms.filter((p) => selectedKeys.has(p.key)).map((p) => p.id);
      await api.put(`/roles/${editingRole.id}/permissions`, { permissionIds });
      toast({ title: 'Permissions updated', variant: 'success' });
      setEditingRole(null);
      await loadRoles();
    } catch (err) {
      toast({ title: 'Failed to save', description: getErrorMessage(err), variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Create custom roles and assign granular, module-level permissions — no code changes required."
        actions={
          hasPermission('roles:create') && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Role
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <Card key={i} className="h-36 animate-pulse bg-muted/40" />)}

        {!isLoading &&
          roles.map((role) => (
            <Card key={role.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="font-display font-semibold leading-tight">{role.name}</p>
                  </div>
                  {role.isSystem && <Badge variant="secondary">Default</Badge>}
                </div>
                <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{role.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="h-3.5 w-3.5" /> {role.userCount} user{role.userCount === 1 ? '' : 's'}
                  </span>
                  <span>{role.permissions.length} permissions</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openPermissionEditor(role)}>
                    Edit Permissions
                  </Button>
                  {!role.isSystem && hasPermission('roles:delete') && (
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(role)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Create role */}
      <EntityFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Custom Role"
        description="Give it a name and description — you'll assign specific permissions next."
        fields={[
          { name: 'name', label: 'Role Name', required: true, fullWidth: true, placeholder: 'e.g. Site Safety Officer' },
          { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
        ]}
        submitLabel="Create Role"
        onSubmit={async (values) => {
          const { data } = await api.post('/roles', { ...values, permissionIds: [] });
          toast({ title: 'Role created — now set its permissions', variant: 'success' });
          await loadRoles();
          openPermissionEditor(data.data);
        }}
      />

      {/* Permission matrix editor */}
      <Dialog open={!!editingRole} onOpenChange={(v) => !v && setEditingRole(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Permissions — {editingRole?.name}</DialogTitle>
            <DialogDescription>
              Toggle exactly what this role can see and do. Changes apply instantly to everyone assigned to it.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-y-auto scrollbar-thin rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                <tr>
                  <th className="p-2 text-left font-medium">Module</th>
                  {ACTIONS.map((a) => (
                    <th key={a} className="p-2 text-center font-medium">{toTitleCase(a)}</th>
                  ))}
                  <th className="p-2 text-center font-medium">All</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(catalog).map(([moduleKey, perms]) => {
                  const allKeys = perms.map((p) => p.key);
                  const allSelected = allKeys.every((k) => selectedKeys.has(k));
                  return (
                    <tr key={moduleKey} className="border-t border-border">
                      <td className="p-2 font-medium">{toTitleCase(moduleKey)}</td>
                      {ACTIONS.map((action) => {
                        const perm = perms.find((p) => p.action === action);
                        return (
                          <td key={action} className="p-2 text-center">
                            {perm ? (
                              <Checkbox checked={selectedKeys.has(perm.key)} onCheckedChange={() => togglePermission(perm.key)} />
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2 text-center">
                        <Checkbox checked={allSelected} onCheckedChange={(c) => toggleModule(moduleKey, allKeys, c === true)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
            <Button onClick={savePermissions} disabled={saving}>{saving ? 'Saving...' : 'Save Permissions'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete role "${deleteTarget?.name}"?`}
        description="Users assigned to this role must be reassigned first."
        onConfirm={async () => {
          try {
            await api.delete(`/roles/${deleteTarget.id}`);
            toast({ title: 'Role deleted', variant: 'success' });
            await loadRoles();
          } catch (err) {
            toast({ title: 'Could not delete role', description: getErrorMessage(err), variant: 'error' });
          }
        }}
      />
    </div>
  );
}
