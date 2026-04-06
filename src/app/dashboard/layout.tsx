import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { DashboardNav } from '@/components/dashboard-nav';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'ADMIN') redirect('/admin');
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardNav user={session.user} isAdmin={false} />
      <main className="flex-1 p-3 sm:p-5 md:p-8 lg:p-10 overflow-auto pt-16 md:pt-8 lg:pt-10 w-full max-w-[2000px]">{children}</main>
    </div>
  );
}
