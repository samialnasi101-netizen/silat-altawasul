import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import { HandCoins } from 'lucide-react';
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
    where: { createdAt: { gte: start, lte: end } },
    include: {
      user: { select: { name: true, staffId: true } },
      branch: { select: { name: true } },
      project: { include: { charity: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const dayTotal = donations.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header flex-col sm:flex-row gap-3">
        <div>
          <h1 className="section-title text-xl sm:text-2xl">
            <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            التبرعات
          </h1>
          <p className="section-subtitle">
            {label ? `يوم ${label}` : 'اليوم'} — {donations.length} عملية — {dayTotal.toLocaleString('ar-SA')} ر.س
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-44 bg-white/5 rounded-xl animate-pulse" />}>
          <DonationsDateFilter />
        </Suspense>
      </div>

      {/* Desktop table */}
      <div className="glass-card overflow-hidden p-0 hidden lg:block">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الفرع</th>
                <th>المشروع / الجمعية</th>
                <th>الموظف</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td className="text-white/60 text-sm whitespace-nowrap">{new Date(d.createdAt).toLocaleString('ar-SA')}</td>
                  <td className="text-white/80 text-sm">{d.branch.name}</td>
                  <td className="text-white/80 text-sm">{d.project.name} — {d.project.charity.name}</td>
                  <td className="text-white/60 text-sm">{d.user ? d.user.name : 'موظف محذوف'}</td>
                  <td className="text-white font-medium text-sm whitespace-nowrap">{Number(d.amount).toLocaleString('ar-SA')} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/tablet card view */}
      <div className="lg:hidden space-y-3">
        {donations.map((d) => (
          <div key={d.id} className="glass-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{d.project.name}</p>
                <p className="text-white/50 text-xs">{d.project.charity.name} • {d.branch.name}</p>
              </div>
              <span className="text-white font-bold text-sm whitespace-nowrap">{Number(d.amount).toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
              <span>{d.user ? d.user.name : 'موظف محذوف'}</span>
              <span>{new Date(d.createdAt).toLocaleString('ar-SA')}</span>
            </div>
          </div>
        ))}
      </div>

      {donations.length === 0 && (
        <div className="glass-card">
          <div className="empty-state py-12">
            <HandCoins className="empty-state-icon w-12 h-12" />
            <p className="empty-state-text">لا توجد تبرعات في هذا التاريخ</p>
          </div>
        </div>
      )}
    </div>
  );
}
