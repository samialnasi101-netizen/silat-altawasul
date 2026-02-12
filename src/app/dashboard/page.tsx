import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { HandCoins, ClipboardList, FolderKanban } from 'lucide-react';

export default async function StaffDashboardPage() {
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  const branchId = (session?.user as { branchId?: string })?.branchId;
  if (!userId || !branchId) {
    return (
      <div className="glass-card">
        <p className="text-white/80">لم يتم تعيين فرع لك. تواصل مع المدير.</p>
      </div>
    );
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const [donationsSum, donationsCount, todaySum, monthSum, latestAttendance, projectsCount] = await Promise.all([
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
  ]);

  const today = latestAttendance && new Date(latestAttendance.checkInAt) >= startOfToday ? latestAttendance : null;
  const isClockedIn = today && !today.checkOutAt;

  const total = Number(donationsSum._sum.amount ?? 0);
  const totalToday = Number(todaySum._sum.amount ?? 0);
  const totalMonth = Number(monthSum._sum.amount ?? 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">لوحتي</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <HandCoins className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">إجمالي تبرعاتي (كل الفترات)</p>
            <p className="text-xl font-bold text-white">{total.toLocaleString('ar-SA')} ر.س</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <HandCoins className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">تبرعات اليوم</p>
            <p className="text-xl font-bold text-white">{totalToday.toLocaleString('ar-SA')} ر.س</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <HandCoins className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">تبرعات هذا الشهر</p>
            <p className="text-xl font-bold text-white">{totalMonth.toLocaleString('ar-SA')} ر.س</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-500/20 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">عدد العمليات</p>
            <p className="text-xl font-bold text-white">{donationsCount}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <FolderKanban className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-white/60 text-sm">المشاريع المتاحة</p>
            <p className="text-xl font-bold text-white">{projectsCount}</p>
          </div>
        </div>
      </div>
      <div className="glass-card">
        <h2 className="text-lg font-semibold text-white mb-2">حالة الحضور اليوم</h2>
        <p className={isClockedIn ? 'text-emerald-400' : 'text-white/70'}>
          {isClockedIn ? '✓ أنت مسجل حضور حاليًا' : today ? 'تم تسجيل الانصراف' : 'لم يتم تسجيل حضور اليوم'}
        </p>
      </div>
    </div>
  );
}
