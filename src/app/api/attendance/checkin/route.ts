import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import {
  getSaudiDateParts,
  parseWorkTimeToSaudiToday,
} from '@/lib/saudi-time';

const NO_CHECKOUT_REASON = 'الموظف لم يسجل خروج من الفرع';

/** Start of today 00:00 in Saudi as UTC timestamp. */
function startOfTodaySaudi(): Date {
  const { year, month, day } = getSaudiDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== 'STAFF') return NextResponse.json({ error: 'Staff only' }, { status: 403 });
    const userId = (session.user as { id?: string }).id;
    const branchId = (session.user as { branchId?: string }).branchId;
    if (!userId || !branchId) return NextResponse.json({ error: 'No branch assigned' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const lat = body.lat != null ? Number(body.lat) : null;
    const lng = body.lng != null ? Number(body.lng) : null;
    const lateReason = body.lateReason ? String(body.lateReason).trim() : null;

    const [branch, user] = await Promise.all([
      prisma.branch.findUnique({ where: { id: branchId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!branch || !user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Branch has location: require user coords and validate distance
    if (branch.lat != null && branch.lng != null && branch.radiusMeters != null) {
      if (lat == null || lng == null) {
        return NextResponse.json(
          { error: 'يجب تفعيل الموقع في المتصفح وأن تكون داخل نطاق الفرع لتسجيل الحضور.' },
          { status: 400 }
        );
      }
      const R = 6371e3;
      const φ1 = (branch.lat * Math.PI) / 180;
      const φ2 = (lat * Math.PI) / 180;
      const Δφ = ((lat - branch.lat) * Math.PI) / 180;
      const Δλ = ((lng - branch.lng) * Math.PI) / 180;
      const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      if (dist > branch.radiusMeters) {
        return NextResponse.json(
          { error: 'أنت خارج نطاق الفرع. يجب أن تكون داخل نطاق الحضور لتسجيل الدخول.' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const startOfToday = startOfTodaySaudi();

    // If user has an open (no checkout) record, handle it
    const openRecord = await prisma.attendanceRecord.findFirst({
      where: { userId, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (openRecord) {
      const openCheckIn = new Date(openRecord.checkInAt);
      if (openCheckIn < startOfToday) {
        // Previous day: auto-checkout with reason, then allow check-in
        await prisma.attendanceRecord.update({
          where: { id: openRecord.id },
          data: {
            checkOutAt: now,
            checkOutEarlyReason: NO_CHECKOUT_REASON,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'لديك حضور مفتوح لهذا اليوم. لا يمكن تسجيل حضور ثانٍ قبل تسجيل الانصراف.' },
          { status: 400 }
        );
      }
    }

    const anyToday = await prisma.attendanceRecord.findFirst({
      where: {
        userId,
        checkInAt: { gte: startOfToday },
      },
    });
    if (anyToday) {
      return NextResponse.json(
        { error: 'تم تسجيل حضورك لهذا اليوم مسبقاً. لا يمكن تسجيل حضور ثانٍ.' },
        { status: 400 }
      );
    }

    const workStart = user.workStart || '09:00';
    const workEnd = user.workEnd || '17:00';
    const workStartToday = parseWorkTimeToSaudiToday(workStart);
    const workEndToday = parseWorkTimeToSaudiToday(workEnd);
    const earliestCheckIn = new Date(workStartToday.getTime() - 10 * 60 * 1000);

    if (now < earliestCheckIn) {
      return NextResponse.json(
        { error: `يمكن تسجيل الحضور قبل 10 دقائق فقط من بداية الدوام. بداية الدوام ${workStart}.` },
        { status: 400 }
      );
    }
    if (now > workEndToday) {
      return NextResponse.json(
        { error: `انتهى وقت الدوام (${workEnd}). لا يمكن تسجيل الحضور بعد نهاية الدوام.` },
        { status: 400 }
      );
    }

    const lateThreshold = new Date(workStartToday.getTime() + 15 * 60 * 1000);
    const isLate = now > lateThreshold;
    if (isLate && (!lateReason || lateReason.length < 3)) {
      return NextResponse.json(
        { error: 'تأخرت أكثر من 15 دقيقة. يرجى إدخال سبب التأخر.' },
        { status: 400 }
      );
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        userId,
        checkInAt: now,
        lat,
        lng,
        checkInLateReason: isLate ? lateReason : null,
      },
    });
    return NextResponse.json(record);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('Check-in error:', err);
    return NextResponse.json(
      { error: 'Server error', detail: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
