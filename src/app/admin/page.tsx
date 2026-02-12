import { prisma } from '@/lib/prisma';
import { MapPin, Users, HandCoins, Building2 } from 'lucide-react';

export default async function AdminLiveDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [branches, activeAttendance, todayDonations, charitiesCount, totalDonationsAll, donationsByBranch] = await Promise.all([
    prisma.branch.findMany({
      include: {
        _count: { select: { users: true, branchProjects: true } },
        users: { select: { id: true } },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { checkOutAt: null },
      include: { user: { include: { branch: { select: { name: true } } } } },
    }),
    prisma.donation.findMany({
      where: { createdAt: { gte: startOfToday } },
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true } },
        project: { include: { charity: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.charity.count(),
    prisma.donation.aggregate({ _sum: { amount: true } }),
    prisma.donation.groupBy({
      by: ['branchId'],
      _sum: { amount: true },
    }),
  ]);

  const branchActiveMap = new Map<string, number>();
  activeAttendance.forEach((a) => {
    const bid = a.user.branchId;
    if (bid) branchActiveMap.set(bid, (branchActiveMap.get(bid) ?? 0) + 1);
  });
  const branchTotalMap = new Map<string, number>();
  donationsByBranch.forEach((g) => {
    branchTotalMap.set(g.branchId, Number(g._sum.amount ?? 0));
  });
  const totalAll = Number(totalDonationsAll._sum.amount ?? 0);
  const todayTotal = todayDonations.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">لوحة التحكم اللحظية</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-emerald-400" />
            <span className="text-white/70">الفروع</span>
          </div>
          <p className="text-2xl font-bold text-white">{branches.length}</p>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-white/70">حاضر الآن</span>
          </div>
          <p className="text-2xl font-bold text-white">{activeAttendance.length}</p>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <HandCoins className="w-8 h-8 text-amber-400" />
            <span className="text-white/70">إجمالي التبرعات (كل الفروع)</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalAll.toLocaleString('ar-SA')} ر.س</p>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-purple-400" />
            <span className="text-white/70">الجمعيات</span>
          </div>
          <p className="text-2xl font-bold text-white">{charitiesCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <h2 className="text-lg font-semibold text-white mb-4">حالة الفروع</h2>
          <ul className="space-y-3">
            {branches.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                <span className="text-white">{b.name}</span>
                <span className={branchActiveMap.get(b.id) ? 'text-emerald-400' : 'text-white/50'}>
                  {branchActiveMap.get(b.id) ?? 0} حاضر
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card">
          <h2 className="text-lg font-semibold text-white mb-4">إجمالي التبرعات حسب الفرع</h2>
          <ul className="space-y-2">
            {branches.map((b) => (
              <li key={b.id} className="flex justify-between py-2 border-b border-white/10 last:border-0">
                <span className="text-white/90">{b.name}</span>
                <span className="text-white font-medium">{(branchTotalMap.get(b.id) ?? 0).toLocaleString('ar-SA')} ر.س</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="text-lg font-semibold text-white mb-4">تبرعات اليوم ({todayTotal.toLocaleString('ar-SA')} ر.س)</h2>
        <ul className="space-y-2 max-h-80 overflow-auto">
          {todayDonations.length === 0 ? (
            <li className="text-white/60">لا توجد تبرعات اليوم بعد</li>
          ) : (
            todayDonations.map((d) => (
              <li key={d.id} className="flex justify-between text-sm py-1">
                <span className="text-white/80">{d.project.name} - {d.branch.name}</span>
                <span className="text-white">{Number(d.amount).toLocaleString('ar-SA')} ر.س</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
