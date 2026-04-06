import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getSaudiDateParts, parseWorkTimeToSaudiToday } from '@/lib/saudi-time';
import { isWithinBranchRadius } from '@/lib/geo';
import { checkinSchema, getZodErrorMessage } from '@/lib/validators';
import { detectAnomalies } from '@/lib/attendance-anomaly';
import {
  LATE_THRESHOLD_MINUTES,
  EARLY_CHECKIN_BUFFER_MINUTES,
  DEFAULT_WORK_START,
  DEFAULT_WORK_END,
  MIN_REASON_LENGTH,
} from '@/lib/constants';

const NO_CHECKOUT_REASON = 'الموظف لم يسجل خروج من الفرع';

function startOfTodaySaudi(): Date {
  const { year, month, day } = getSaudiDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
}

export async function POST(req: Request) {
  try {
    const session = await requireStaff();
    const { id: userId, role, branchId } = session.user;
    if (role !== 'STAFF') return NextResponse.json({ error: 'Staff only' }, { status: 403 });
    if (!branchId) return NextResponse.json({ error: 'No branch assigned' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { lat, lng, accuracy, lateReason } = parsed.data;

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
      if (!isWithinBranchRadius(lat, lng, branch.lat, branch.lng, branch.radiusMeters)) {
        return NextResponse.json(
          { error: 'أنت خارج نطاق الفرع. يجب أن تكون داخل نطاق الحضور لتسجيل الدخول.' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const startOfToday = startOfTodaySaudi();

    // Handle open records from previous days
    const openRecord = await prisma.attendanceRecord.findFirst({
      where: { userId, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (openRecord) {
      const openCheckIn = new Date(openRecord.checkInAt);
      if (openCheckIn < startOfToday) {
        await prisma.attendanceRecord.update({
          where: { id: openRecord.id },
          data: { checkOutAt: now, checkOutEarlyReason: NO_CHECKOUT_REASON },
        });
      } else {
        return NextResponse.json(
          { error: 'لديك حضور مفتوح لهذا اليوم. لا يمكن تسجيل حضور ثانٍ قبل تسجيل الانصراف.' },
          { status: 400 }
        );
      }
    }

    const anyToday = await prisma.attendanceRecord.findFirst({
      where: { userId, checkInAt: { gte: startOfToday } },
    });
    if (anyToday) {
      return NextResponse.json(
        { error: 'تم تسجيل حضورك لهذا اليوم مسبقاً. لا يمكن تسجيل حضور ثانٍ.' },
        { status: 400 }
      );
    }

    const workStart = user.workStart || DEFAULT_WORK_START;
    const workEnd = user.workEnd || DEFAULT_WORK_END;
    const workStartToday = parseWorkTimeToSaudiToday(workStart);
    const workEndToday = parseWorkTimeToSaudiToday(workEnd);
    const earliestCheckIn = new Date(workStartToday.getTime() - EARLY_CHECKIN_BUFFER_MINUTES * 60 * 1000);

    if (now < earliestCheckIn) {
      return NextResponse.json(
        { error: `يمكن تسجيل الحضور قبل ${EARLY_CHECKIN_BUFFER_MINUTES} دقائق فقط من بداية الدوام. بداية الدوام ${workStart}.` },
        { status: 400 }
      );
    }
    if (now > workEndToday) {
      return NextResponse.json(
        { error: `انتهى وقت الدوام (${workEnd}). لا يمكن تسجيل الحضور بعد نهاية الدوام.` },
        { status: 400 }
      );
    }

    const lateThreshold = new Date(workStartToday.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);
    const isLate = now > lateThreshold;
    if (isLate && (!lateReason || lateReason.length < MIN_REASON_LENGTH)) {
      return NextResponse.json(
        { error: `تأخرت أكثر من ${LATE_THRESHOLD_MINUTES} دقيقة. يرجى إدخال سبب التأخر.` },
        { status: 400 }
      );
    }

    // --- Anomaly detection ---
    let suspicious = false;
    let suspiciousReason: string | null = null;

    if (lat != null && lng != null) {
      // Get last 7 check-in coordinates for this user
      const recentRecords = await prisma.attendanceRecord.findMany({
        where: { userId, lat: { not: null }, lng: { not: null } },
        orderBy: { checkInAt: 'desc' },
        take: 7,
        select: { lat: true, lng: true },
      });
      const previousCoords = recentRecords
        .filter((r): r is { lat: number; lng: number } => r.lat != null && r.lng != null)
        .map((r) => ({ lat: r.lat, lng: r.lng }));

      const anomaly = detectAnomalies(
        lat,
        lng,
        accuracy ?? null,
        branch.lat,
        branch.lng,
        previousCoords
      );

      suspicious = anomaly.suspicious;
      suspiciousReason = anomaly.reasons.length > 0 ? anomaly.reasons.join(' | ') : null;
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        userId,
        checkInAt: now,
        lat: lat ?? null,
        lng: lng ?? null,
        accuracy: accuracy ?? null,
        checkInLateReason: isLate ? (lateReason ?? null) : null,
        suspicious,
        suspiciousReason,
      },
    });
    return NextResponse.json(record);
  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json(
      { error: 'Server error', detail: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : undefined) : undefined },
      { status: 500 }
    );
  }
}
