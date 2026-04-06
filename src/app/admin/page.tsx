import { prisma } from '@/lib/prisma';
import { MapPin, Users, HandCoins, Building2, ArrowUpLeft, Activity } from 'lucide-react';
import Link from 'next/link';
import AdminDashboardCharts from './dashboard-charts';

export default async function AdminLiveDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get last 7 days for trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const [branches, activeAttendance, todayDonations, charitiesCount, totalDonationsAll, donationsByBranch, staffCount, todayDonationsCount, monthDonations, projectsCount, last7DaysDonations] = await Promise.all([
    prisma.branch.findMany({
      include: { _count: { select: { users: true, branchProjects: true } } },
    }),
    prisma.attendanceRecord.findMany({
      where: { checkOutAt: null },
      select: { userId: true, user: { select: { branchId: true, branch: { select: { name: true } } } } },
    }),
    prisma.donation.findMany({
      where: { createdAt: { gte: startOfToday } },
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true } },
        project: { include: { charity: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    prisma.charity.count(),
    prisma.donation.aggregate({ _sum: { amount: true } }),
    prisma.donation.groupBy({
      by: ['branchId'],
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { role: 'STAFF', active: true } }),
    prisma.donation.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.donation.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.project.count(),
    // Get donations for each of last 7 days
    prisma.donation.findMany({
      where: { createdAt: { gte: last7Days[0] } },
      select: { amount: true, createdAt: true },
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
  const monthTotal = Number(monthDonations._sum.amount ?? 0);

  // Build weekly trend data
  const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const weeklyTrend = last7Days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayDonations = last7DaysDonations.filter((d) => {
      const dt = new Date(d.createdAt);
      return dt >= day && dt < nextDay;
    });
    return {
      label: dayNames[day.getDay()],
      amount: dayDonations.reduce((s, d) => s + Number(d.amount), 0),
    };
  });

  // Build donut data
  const donutData = branches
    .map((b) => ({ name: b.name, value: branchTotalMap.get(b.id) ?? 0 }))
    .filter((d) => d.value > 0);

  // Build bar chart data
  const barData = branches.map((b) => ({
    name: b.name,
    amount: branchTotalMap.get(b.id) ?? 0,
    active: branchActiveMap.get(b.id) ?? 0,
  }));

  const stats = [
    { label: 'الفروع', value: branches.length, icon: MapPin, color: 'emerald', href: '/admin/branches' },
    { label: 'حاضر الآن', value: activeAttendance.length, icon: Users, color: 'blue', href: '/admin/attendance', live: true },
    { label: 'الموظفين النشطين', value: staffCount, icon: Users, color: 'cyan', href: '/admin/staff' },
    { label: 'الجمعيات', value: charitiesCount, icon: Building2, color: 'purple', href: '/admin/charities' },
  ];

  const colorMap: Record<string, { bg: string; text: string; card: string }> = {
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', card: 'stat-card-emerald' },
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', card: 'stat-card-blue' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', card: 'stat-card-amber' },
    purple: { bg: 'bg-purple-500/15', text: 'text-purple-400', card: 'stat-card-purple' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', card: 'stat-card-cyan' },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
          <div className="flex items-center gap-1.5 pill-active">
            <div className="live-dot" />
            <span>مباشر</span>
          </div>
        </div>
        <p className="text-white/40 text-sm">نظرة شاملة على النظام — {projectsCount} مشروع نشط</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const c = colorMap[s.color];
          return (
            <Link key={s.label} href={s.href} className={`stat-card ${c.card} animate-slide-up stagger-${i + 1} group`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`icon-box ${c.bg}`}>
                  <s.icon className={`w-5 h-5 ${c.text}`} />
                </div>
                {s.live && <div className="live-dot" />}
                <ArrowUpLeft className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-white/40 text-sm mt-0.5">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Charts row — client component */}
      <AdminDashboardCharts
        totalAll={totalAll}
        monthTotal={monthTotal}
        todayTotal={todayTotal}
        todayCount={todayDonationsCount}
        weeklyTrend={weeklyTrend}
        donutData={donutData}
        barData={barData}
      />

      {/* Branch status + progress bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              حالة الفروع
            </h2>
            <span className="text-white/30 text-xs">{activeAttendance.length} حاضر</span>
          </div>
          <div className="space-y-1">
            {branches.map((b) => {
              const active = branchActiveMap.get(b.id) ?? 0;
              const total = b._count.users;
              const pct = total > 0 ? (active / total) * 100 : 0;
              return (
                <div key={b.id} className="feed-item px-2 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active > 0 ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <span className="text-white/80 text-sm truncate">{b.name}</span>
                    <div className="flex-1 mx-3 h-1 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-emerald-500/40 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-sm font-bold ${active > 0 ? 'text-emerald-400' : 'text-white/20'}`}>{active}</span>
                    <span className="text-white/20 text-xs">/ {total}</span>
                  </div>
                </div>
              );
            })}
            {branches.length === 0 && <p className="empty-state-text text-sm">لا توجد فروع</p>}
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-amber-400" />
              التبرعات حسب الفرع
            </h2>
            <span className="text-white/30 text-xs">{totalAll.toLocaleString('ar-SA')} ر.س</span>
          </div>
          <div className="space-y-3">
            {branches.map((b, i) => {
              const branchTotal = branchTotalMap.get(b.id) ?? 0;
              const pct = totalAll > 0 ? (branchTotal / totalAll) * 100 : 0;
              const colors = ['from-emerald-400 to-emerald-600', 'from-blue-400 to-blue-600', 'from-amber-400 to-amber-600', 'from-purple-400 to-purple-600', 'from-cyan-400 to-cyan-600'];
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{b.name}</span>
                    <span className="text-white font-medium">{branchTotal.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-l ${colors[i % colors.length]} rounded-full transition-all duration-1000`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {branches.length === 0 && <p className="empty-state-text text-sm">لا توجد فروع</p>}
          </div>
        </div>
      </div>

      {/* Today's donations feed */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">تبرعات اليوم</h2>
            <span className="pill-active">{todayTotal.toLocaleString('ar-SA')} ر.س</span>
          </div>
          <Link href="/admin/donations" className="text-emerald-400/70 text-xs hover:text-emerald-400 transition">
            عرض الكل
          </Link>
        </div>
        <div className="space-y-0">
          {todayDonations.length === 0 ? (
            <div className="empty-state py-8">
              <HandCoins className="empty-state-icon w-10 h-10" />
              <p className="empty-state-text text-sm">لا توجد تبرعات اليوم بعد</p>
            </div>
          ) : (
            todayDonations.map((d, i) => (
              <div key={d.id} className={`feed-item animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <HandCoins className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">{d.project.name}</p>
                    <p className="text-white/30 text-xs">{d.branch.name} • {d.user?.name ?? 'موظف محذوف'}</p>
                  </div>
                </div>
                <span className="text-white font-medium text-sm">{Number(d.amount).toLocaleString('ar-SA')} ر.س</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
