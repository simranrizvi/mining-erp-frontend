'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mountain } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { NAV_SECTIONS } from './nav-config';
import { cn } from '@/lib/utils';

export function Sidebar({ mobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasPermission(item.permission)),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:inset-auto lg:top-0 lg:left-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
       <div className="hazard-corner flex items-center gap-2.5 px-5 mb-5 py-2 border-b border-sidebar-border  ">
  {/* Logo Image */}
  <img 
    src="/logo.png" 
    alt="Atlas Mining Logo" 
    className="h-14 w-auto object-contain" 
  />
</div>

        <nav className="flex-1 overflow-y-auto scrollbar-hidden px-3 pb-6">
          {visibleSections.map((section, idx) => (
            <div key={idx} className="mb-4">
              {section.heading && (
                <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {section.heading}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onCloseMobile}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-3 text-[11px] text-sidebar-foreground/40">
          v1.0.0 — Mining Management ERP
        </div>
      </aside>
    </>
  );
}