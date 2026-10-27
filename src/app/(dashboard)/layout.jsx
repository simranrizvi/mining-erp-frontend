// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Loader2 } from 'lucide-react';
// import { useAuth } from '@/context/auth-context';
// import { Sidebar } from '@/components/layout/sidebar';
// import { Topbar } from '@/components/layout/topbar';

// export default function DashboardLayout({ children }) {
//   const { user, isLoading } = useAuth();
//   const router = useRouter();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   useEffect(() => {
//     if (!isLoading && !user) router.replace('/login');
//   }, [isLoading, user, router]);

//   if (isLoading || !user) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-background">
//         <Loader2 className="h-6 w-6 animate-spin text-primary" />
//       </div>
//     );
//   }

//   return (
//     <div className="flex min-h-screen bg-background">
//       <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
//       <div className="flex min-w-0 flex-1 flex-col">
//         <Topbar onOpenMobile={() => setMobileOpen(true)} />
//         <main className="flex-1 overflow-x-hidden p-4 lg:p-6">{children}</main>
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function DashboardLayout({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
