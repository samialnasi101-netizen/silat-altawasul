import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { closeStaleOpenAttendance } from '@/lib/attendance-server';
import { getSaudiDateParts, formatTimeSaudi, formatDateSaudi } from '@/lib/saudi-time';
import { ClipboardList, LogIn, LogOut, Clock } from 'lucide-react';
import AttendanceActions from './attendance-actions';

function startOfTodaySaudi(): Date {
  const { year, month, day } = getSaudiDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
}

export default async function StaffAttendancePage() {
  const session = await getSession();
  const userId = session?.user?.id;
  const branchId = session?.user?.branchId;
  if (!userId) return null;

  const user = branchId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { workStart: true, workEnd: true, branch: { select: { lat: true, lng: true, radiusMeters: true } } },
      })
    : null;

  await closeStaleOpenAttendance(userId, user?.workEnd ?? '17:00');

  const records = await prisma.attendanceRecord.findMany({
    where: { userId },
    orderBy: { checkInAt: 'desc' },
    take: 30,
  });

  const todayStart = startOfTodaySaudi();
  const todayRecord = records.find((r) => new Date(r.checkInAt) >= todayStart && !r.checkOutAt);
  const branchNeedsLocation =
    user?.branch != null &&
    user.branch.lat != null &&
    user.branch.lng != null &&
    user.branch.radiusMeters != null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            الحضور والانصراف
          </h1>
          <p className="section-subtitle">سجّل حضورك وانصرافك وتابع سجلك</p>
        </div>
      </div>

      {!branchId ? (
        <div className="glass-card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-white/80 text-lg mb-1">لم يتم تعيين فرع لك</p>
          <p className="text-white/40 text-sm">لا يمكن تسجيل الحضور بدون فرع</p>
        </div>
      ) : (
        <AttendanceActions
          hasOpenAttendance={!!todayRecord}
          branchNeedsLocation={!!branchNeedsLocation}
          workStart={user?.workStart ?? '09:00'}
          workEnd={user?.workEnd ?? '17:00'}
        />
      )}

      <div className="glass-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40" />
            سجل الحضور
          </h2>
          <span className="text-white/30 text-xs">{records.length} سجل</span>
        </div>
        <div className="space-y-1">
          {records.map((r) => {
            const isOpen = !r.checkOutAt;
            return (
              <div key={r.id} className="feed-item px-3 py-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOpen ? 'bg-emerald-500/15' : 'bg-white/5'}`}>
                    {isOpen ? <LogIn className="w-4 h-4 text-emerald-400" /> : <LogOut className="w-4 h-4 text-white/30" />}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">
                      {formatDateSaudi(new Date(r.checkInAt))}
                    </p>
                    <p className="text-white/40 text-xs">
                      دخول {formatTimeSaudi(new Date(r.checkInAt))}
                      {r.checkOutAt && ` — خروج ${formatTimeSaudi(new Date(r.checkOutAt))}`}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <span className="pill-active">حاضر</span>
                ) : (
                  <span className="text-white/30 text-xs">مكتمل</span>
                )}
              </div>
            );
          })}
        </div>
        {records.length === 0 && (
          <div className="empty-state py-8">
            <ClipboardList className="empty-state-icon w-10 h-10" />
            <p className="empty-state-text text-sm">لا توجد سجلات حضور</p>
          </div>
        )}
      </div>
    </div>
  );
}
