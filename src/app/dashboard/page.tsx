import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { HandCoins, ClipboardList, FolderKanban, TrendingUp, Clock, ArrowLeft, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { StatValue, AttendanceRing } from './dashboard-client';

export default async function StaffDashboardPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  const branchId = session?.user?.branchId;
  const userName = session?.user?.name ?? 'مستخدم';

  if (!userId || !branchId) {
    return (
      <div className="glass-card max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-amber-400" />
        </div>
        <p className="text-white/80 text-lg mb-2">لم يتم تعيين فرع لك</p>
        <p className="text-white/40 text-sm">تواصل مع المدير لتعيينك على فرع</p>
      </div>
    );
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const [donationsSum, donationsCount, todaySum, monthSum, latestAttendance, projectsCount, branch, monthAttendance] = await Promise.all([
    prisma.donation.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.donation.count({ where: { userId } }),
    prisma.donation.aggregate({
      where: { userId, createdAt: { gte: startOfToday } },
      _sum: { amount: true },
    }),
    prisma.donation.aggregate({
      where: { userId, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.attendanceRecord.findFirst({
      where: { userId },
      orderBy: { checkInAt: 'desc' },
    }),
    prisma.branchProject.count({ where: { branchId } }),
    prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } }),
    prisma.attendanceRecord.count({
      where: { userId, checkInAt: { gte: startOfMonth } },
    }),
  ]);

  const today = latestAttendance && new Date(latestAttendance.checkInAt) >= startOfToday ? latestAttendance : null;
  const isClockedIn = today && !today.checkOutAt;

  const total = Number(donationsSum._sum.amount ?? 0);
  const totalToday = Number(todaySum._sum.amount ?? 0);
  const totalMonth = Number(monthSum._sum.amount ?? 0);
  const daysInMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 0).getDate();

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting banner */}
      <div className="greeting-banner">
        <div className="relative z-10">
          <p className="text-white/50 text-sm mb-1">{greeting}</p>
          <h1 className="text-2xl font-bold text-white mb-2">{userName}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? 'bg-emerald-400 animate-glow-pulse' : 'bg-white/20'}`} />
              <span className={`text-sm ${isClockedIn ? 'text-emerald-300' : 'text-white/50'}`}>
                {isClockedIn ? 'حاضر الآن' : today ? 'انتهى الدوام' : 'لم تسجل حضور اليوم'}
              </span>
            </div>
            {branch && (
              <span className="text-white/30 text-sm">فرع {branch.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card stat-card-emerald animate-slide-up stagger-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box bg-emerald-500/15">
              <HandCoins className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <StatValue value={total} />
          <p className="text-white/40 text-xs mt-1">إجمالي التبرعات (ر.س)</p>
        </div>

        <div className="stat-card stat-card-blue animate-slide-up stagger-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box bg-blue-500/15">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <StatValue value={totalToday} />
          <p className="text-white/40 text-xs mt-1">تبرعات اليوم (ر.س)</p>
        </div>

        <div className="stat-card stat-card-amber animate-slide-up stagger-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box bg-amber-500/15">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <StatValue value={totalMonth} />
          <p className="text-white/40 text-xs mt-1">تبرعات الشهر (ر.س)</p>
        </div>

        <div className="stat-card stat-card-purple animate-slide-up stagger-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box bg-purple-500/15">
              <ClipboardList className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <StatValue value={donationsCount} />
          <p className="text-white/40 text-xs mt-1">عدد العمليات</p>
        </div>
      </div>

      {/* Attendance progress ring */}
      <div className="glass-card flex items-center gap-6 animate-slide-up stagger-5">
        <AttendanceRing daysPresent={monthAttendance} daysInMonth={daysInMonth} />
        <div>
          <h3 className="text-white font-medium flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            نسبة الحضور هذا الشهر
          </h3>
          <p className="text-white/40 text-sm mt-1">
            {monthAttendance} يوم حضور من أصل {daysInMonth} يوم
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/attendance" className="glass-card group hover:border-emerald-500/20 flex items-center gap-4">
          <div className="icon-box bg-emerald-500/15">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">الحضور والانصراف</p>
            <p className="text-white/40 text-xs mt-0.5">
              {isClockedIn ? 'سجّل انصرافك' : 'سجّل حضورك'}
            </p>
          </div>
          <ArrowLeft className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-all group-hover:-translate-x-1" />
        </Link>

        <Link href="/dashboard/donations" className="glass-card group hover:border-amber-500/20 flex items-center gap-4">
          <div className="icon-box bg-amber-500/15">
            <HandCoins className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">تسجيل تبرع</p>
            <p className="text-white/40 text-xs mt-0.5">{projectsCount} مشروع متاح</p>
          </div>
          <ArrowLeft className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-all group-hover:-translate-x-1" />
        </Link>

        <div className="glass-card flex items-center gap-4">
          <div className="icon-box bg-blue-500/15">
            <FolderKanban className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">المشاريع المتاحة</p>
            <p className="text-white/40 text-xs mt-0.5">{projectsCount} مشروع في فرعك</p>
          </div>
        </div>
      </div>
    </div>
  );
}
