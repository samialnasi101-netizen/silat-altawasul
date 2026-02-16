import { prisma } from '@/lib/prisma';
import { getSaudiDateParts, parseWorkTimeToSaudiToday } from '@/lib/saudi-time';

const NO_CHECKOUT_REASON = 'الموظف لم يسجل خروج من الفرع';

/** Start of today 00:00 in Saudi as UTC. */
function startOfTodaySaudi(): Date {
  const { year, month, day } = getSaudiDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
}

/**
 * If the user has an open attendance record and Saudi time is past workEnd+15,
 * auto-checkout that record. Returns true if an auto-checkout was performed.
 */
export async function closeStaleOpenAttendance(
  userId: string,
  workEnd: string = '17:00'
): Promise<boolean> {
  const open = await prisma.attendanceRecord.findFirst({
    where: { userId, checkOutAt: null },
    orderBy: { checkInAt: 'desc' },
  });
  if (!open) return false;

  const now = new Date();
  const workEndToday = parseWorkTimeToSaudiToday(workEnd);
  const latestCheckOut = new Date(workEndToday.getTime() + 15 * 60 * 1000);
  if (now <= latestCheckOut) return false;

  const openCheckIn = new Date(open.checkInAt);
  const startOfToday = startOfTodaySaudi();
  if (openCheckIn < startOfToday) return false;

  const checkoutAt = new Date(latestCheckOut);
  await prisma.attendanceRecord.update({
    where: { id: open.id },
    data: {
      checkOutAt: checkoutAt,
      checkOutEarlyReason: NO_CHECKOUT_REASON,
    },
  });
  return true;
}
