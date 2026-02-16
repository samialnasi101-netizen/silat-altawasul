import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { closeStaleOpenAttendance } from '@/lib/attendance-server';
import { getSaudiDateParts, formatTimeSaudi, formatDateSaudi } from '@/lib/saudi-time';
import AttendanceActions from './attendance-actions';

function startOfTodaySaudi(): Date {
  const { year, month, day } = getSaudiDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
}

export default async function StaffAttendancePage() {
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  const branchId = (session?.user as { branchId?: string })?.branchId;
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
      <h1 className="text-2xl font-bold text-white">الحضور والانصراف</h1>
      {!branchId ? (
        <div className="glass-card">
          <p className="text-white/80">لم يتم تعيين فرع لك. لا يمكن تسجيل الحضور.</p>
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
        <h2 className="text-lg font-semibold text-white mb-4">سجل الحضور</h2>
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
              <span className="text-white/80">
                {formatDateSaudi(new Date(r.checkInAt))} — دخول {formatTimeSaudi(new Date(r.checkInAt))}
                {r.checkOutAt && ` / خروج ${formatTimeSaudi(new Date(r.checkOutAt))}`}
              </span>
              {!r.checkOutAt && <span className="text-emerald-400 text-sm">حاضر الآن</span>}
            </li>
          ))}
        </ul>
        {records.length === 0 && <p className="text-white/60">لا توجد سجلات</p>}
      </div>
    </div>
  );
}
