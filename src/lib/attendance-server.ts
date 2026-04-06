import { prisma } from '@/lib/prisma';
import { getSaudiDateParts, parseWorkTimeToSaudiToday } from '@/lib/saudi-time';
import { POST_WORK_CHECKOUT_WINDOW_MINUTES, DEFAULT_WORK_END } from '@/lib/constants';

const NO_CHECKOUT_REASON = 'الموظف لم يسجل خروج من الفرع';

function startOfTodaySaudi(): Date {
  const { year, month, day } = getSaudiDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
}

/**
 * If the user has an open attendance record and Saudi time is past workEnd + checkout window,
 * auto-checkout that record. Returns true if an auto-checkout was performed.
 */
export async function closeStaleOpenAttendance(
  userId: string,
  workEnd: string = DEFAULT_WORK_END
): Promise<boolean> {
  const open = await prisma.attendanceRecord.findFirst({
    where: { userId, checkOutAt: null },
    orderBy: { checkInAt: 'desc' },
  });
  if (!open) return false;

  const now = new Date();
  const workEndToday = parseWorkTimeToSaudiToday(workEnd);
  const latestCheckOut = new Date(workEndToday.getTime() + POST_WORK_CHECKOUT_WINDOW_MINUTES * 60 * 1000);
  if (now <= latestCheckOut) return false;

  const openCheckIn = new Date(open.checkInAt);
  const startOfToday = startOfTodaySaudi();
  if (openCheckIn < startOfToday) return false;

  await prisma.attendanceRecord.update({
    where: { id: open.id },
    data: {
      checkOutAt: new Date(latestCheckOut),
      checkOutEarlyReason: NO_CHECKOUT_REASON,
    },
  });
  return true;
}
