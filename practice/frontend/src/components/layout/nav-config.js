import {
  LayoutDashboard, Users, ShieldCheck, MapPin, UserRound, CalendarCheck, CalendarClock,
  Pickaxe, Truck, Wrench, Boxes, ShoppingCart, Fuel, Wallet, FileBarChart, Settings, ScrollText,
} from 'lucide-react';

/**
 * Single source of truth for the sidebar. `permission` is checked against
 * useAuth().hasPermission(), so a link only renders if the signed-in user's
 * role actually grants it — including brand-new custom roles the Super
 * Admin creates later, with zero changes needed here.
 */
export const NAV_SECTIONS = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:read' }],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Users', href: '/users', icon: Users, permission: 'users:read' },
      { label: 'Roles & Permissions', href: '/roles', icon: ShieldCheck, permission: 'roles:read' },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, permission: 'audit_logs:read' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Mine Sites', href: '/mine-sites', icon: MapPin, permission: 'mine_sites:read' },
      { label: 'Production', href: '/mining/production', icon: Pickaxe, permission: 'mining.production:read' },
    ],
  },
  {
    heading: 'Human Resources',
    items: [
      { label: 'Employees', href: '/hr/employees', icon: UserRound, permission: 'hr.employees:read' },
      { label: 'Attendance', href: '/hr/attendance', icon: CalendarCheck, permission: 'hr.attendance:read' },
      { label: 'Leave Requests', href: '/hr/leave', icon: CalendarClock, permission: 'hr.leave:read' },
    ],
  },
  {
    heading: 'Assets',
    items: [
      { label: 'Equipment', href: '/equipment', icon: Pickaxe, permission: 'equipment:read' },
      { label: 'Vehicles', href: '/vehicles', icon: Truck, permission: 'vehicles:read' },
      { label: 'Maintenance', href: '/maintenance', icon: Wrench, permission: 'maintenance:read' },
    ],
  },
  {
    heading: 'Supply Chain',
    items: [
      { label: 'Inventory', href: '/inventory', icon: Boxes, permission: 'inventory:read' },
      { label: 'Procurement', href: '/procurement', icon: ShoppingCart, permission: 'procurement:read' },
      { label: 'Fuel Management', href: '/fuel', icon: Fuel, permission: 'fuel:read' },
    ],
  },
  {
    heading: 'Finance',
    items: [{ label: 'Finance & Accounting', href: '/finance', icon: Wallet, permission: 'finance.expenses:read' }],
  },
  {
    heading: 'Insights',
    items: [
      { label: 'Reports & Analytics', href: '/reports', icon: FileBarChart, permission: 'reports:read' },
      { label: 'System Settings', href: '/settings', icon: Settings, permission: 'settings:read' },
    ],
  },
];
