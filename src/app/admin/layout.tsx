import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { DashboardNav } from '@/components/dashboard-nav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (role !== 'ADMIN') redirect('/dashboard');
  return (
    <div className="min-h-screen flex">
      <DashboardNav user={session.user} isAdmin />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
