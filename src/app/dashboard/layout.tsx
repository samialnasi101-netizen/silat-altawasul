import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { DashboardNav } from '@/components/dashboard-nav';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (role === 'ADMIN') redirect('/admin');
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardNav user={session.user} isAdmin={false} />
      <main className="flex-1 p-4 md:p-6 overflow-auto pt-16 md:pt-6">{children}</main>
    </div>
  );
}
