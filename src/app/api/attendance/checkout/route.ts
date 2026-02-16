import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { parseWorkTimeToSaudiToday } from '@/lib/saudi-time';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const earlyReason = body.earlyReason ? String(body.earlyReason).trim() : null;
    const lat = body.lat != null ? Number(body.lat) : null;
    const lng = body.lng != null ? Number(body.lng) : null;

    const open = await prisma.attendanceRecord.findFirst({
      where: { userId, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
      include: { user: { include: { branch: true } } },
    });
    if (!open) return NextResponse.json({ error: 'No open attendance' }, { status: 400 });

    const now = new Date();
    const workEnd = open.user.workEnd || '17:00';
    const workEndToday = parseWorkTimeToSaudiToday(workEnd);
    const latestCheckOut = new Date(workEndToday.getTime() + 15 * 60 * 1000); // 15 min after work end

    // انصراف من نهاية الدوام حتى 15 دقيقة بعدها فقط
    if (now < workEndToday) {
      return NextResponse.json(
        { error: `يمكن تسجيل الانصراف من نهاية الدوام (${workEnd}) حتى 15 دقيقة بعدها فقط.` },
        { status: 400 }
      );
    }
    if (now > latestCheckOut) {
      return NextResponse.json(
        { error: 'انتهى وقت تسجيل الانصراف يدوياً (15 دقيقة بعد نهاية الدوام). سيتم إغلاق الحضور تلقائياً عند فتح الصفحة.' },
        { status: 400 }
      );
    }

    // الانصراف من نفس موقع الفرع
    const branch = open.user.branch;
    if (branch?.lat != null && branch?.lng != null && branch?.radiusMeters != null) {
      if (lat == null || lng == null) {
        return NextResponse.json(
          { error: 'يجب تفعيل الموقع وأن تكون داخل نطاق الفرع لتسجيل الانصراف.' },
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
          { error: 'أنت خارج نطاق الفرع. يجب أن تكون في موقع الفرع لتسجيل الانصراف.' },
          { status: 400 }
        );
      }
    }

    const record = await prisma.attendanceRecord.update({
      where: { id: open.id },
      data: {
        checkOutAt: now,
        checkOutEarlyReason: earlyReason && earlyReason.trim().length >= 3 ? earlyReason.trim() : null,
      },
    });
    return NextResponse.json(record);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: 'Server error', detail: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
