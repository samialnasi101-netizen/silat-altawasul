import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import DonationsDateFilter from './donations-date-filter';

function getDayRange(dateStr: string | null) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, 0, 0, 0);
    const end = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999);
    return { start, end, label: dateStr || null };
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end, label: dateStr };
}

export default async function AdminDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const { start, end, label } = getDayRange(dateParam ?? null);

  const donations = await prisma.donation.findMany({
    where: {
      createdAt: { gte: start, lte: end },
    },
    include: {
      user: { select: { name: true, staffId: true } },
      branch: { select: { name: true } },
      project: { include: { charity: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">التبرعات</h1>
        <Suspense fallback={<div className="h-10 w-44 bg-white/5 rounded-xl animate-pulse" />}>
          <DonationsDateFilter />
        </Suspense>
      </div>
      {label && (
        <p className="text-white/70 text-sm">
          عرض تبرعات يوم: <span className="text-white font-medium">{label}</span>
        </p>
      )}
      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-right text-white/70 text-sm">
              <th className="p-4">التاريخ</th>
              <th className="p-4">الفرع</th>
              <th className="p-4">المشروع / الجمعية</th>
              <th className="p-4">الموظف</th>
              <th className="p-4">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white/80">{new Date(d.createdAt).toLocaleString('ar-SA')}</td>
                <td className="p-4 text-white/80">{d.branch.name}</td>
                <td className="p-4 text-white/80">{d.project.name} — {d.project.charity.name}</td>
                <td className="p-4 text-white/80">{d.user ? `${d.user.name} (${d.user.staffId})` : 'موظف محذوف'}</td>
                <td className="p-4 text-white font-medium">{Number(d.amount).toLocaleString('ar-SA')} ر.س</td>
              </tr>
            ))}
          </tbody>
        </table>
        {donations.length === 0 && (
          <p className="p-8 text-center text-white/60">لا توجد تبرعات في هذا التاريخ</p>
        )}
      </div>
    </div>
  );
}
