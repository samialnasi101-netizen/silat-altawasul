import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

function parseWorkStart(timeStr: string): { h: number; m: number } {
  if (!timeStr || typeof timeStr !== 'string') return { h: 9, m: 0 };
  const parts = timeStr.trim().split(':');
  const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
  return { h, m };
}

function lateMinutes(checkInAt: Date, workStart: string): number {
  const { h, m } = parseWorkStart(workStart);
  const d = new Date(checkInAt);
  const workStartSameDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
  if (d.getTime() <= workStartSameDay.getTime()) return 0;
  return Math.round((d.getTime() - workStartSameDay.getTime()) / 60000);
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') ?? '', 10);
    const month = parseInt(url.searchParams.get('month') ?? '', 10);
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'year, month مطلوبة' }, { status: 400 });
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const staff = await prisma.user.findMany({
      where: { role: 'STAFF' },
      select: { id: true, name: true, staffId: true, workStart: true },
    });

    const records = await prisma.attendanceRecord.findMany({
      where: { checkInAt: { gte: start, lte: end } },
      select: { userId: true, checkInAt: true },
    });

    const presentDaysByUser = new Map<string, Set<number>>();
    const lateMinutesByUser = new Map<string, number>();

    for (const r of records) {
      const checkIn = r.checkInAt instanceof Date ? r.checkInAt : new Date(r.checkInAt);
      const day = checkIn.getUTCDate();
      if (!presentDaysByUser.has(r.userId)) presentDaysByUser.set(r.userId, new Set());
      presentDaysByUser.get(r.userId)!.add(day);

      const u = staff.find((s) => s.id === r.userId);
      const workStart = u?.workStart ?? '09:00';
      const late = lateMinutes(r.checkInAt, workStart);
      lateMinutesByUser.set(r.userId, (lateMinutesByUser.get(r.userId) ?? 0) + late);
    }

    const employees = staff.map((u) => {
      const daysPresent = presentDaysByUser.get(u.id)?.size ?? 0;
      const daysAbsent = daysInMonth - daysPresent;
      const lateMin = lateMinutesByUser.get(u.id) ?? 0;
      const lateHours = Math.round((lateMin / 60) * 10) / 10;
      return {
        name: u.name,
        staffId: u.staffId,
        daysPresent,
        daysAbsent,
        lateMinutes: lateMin,
        lateHours,
      };
    });

    return NextResponse.json({
      year,
      month,
      daysInMonth,
      employees,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
