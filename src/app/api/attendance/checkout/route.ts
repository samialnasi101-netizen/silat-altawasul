import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

function parseTimeToToday(timeStr: string): Date {
  if (!timeStr || typeof timeStr !== 'string') {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    return d;
  }
  const parts = timeStr.trim().split(':');
  const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

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
    const workEndToday = parseTimeToToday(workEnd);

    // انصراف عند نهاية الدوام فقط (أو بعدها)
    if (now < workEndToday) {
      return NextResponse.json(
        { error: `يمكن تسجيل الانصراف عند نهاية الدوام فقط (${workEnd}).` },
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

    const earlyThreshold = new Date(workEndToday.getTime() - 10 * 60 * 1000);
    const isEarlyOut = now < earlyThreshold;
    if (isEarlyOut && (!earlyReason || earlyReason.length < 3)) {
      return NextResponse.json(
        { error: 'الانصراف قبل 10 دقائق من نهاية الدوام يتطلب إدخال سبب.', code: 'EARLY_REASON_REQUIRED' },
        { status: 400 }
      );
    }

    const record = await prisma.attendanceRecord.update({
      where: { id: open.id },
      data: {
        checkOutAt: now,
        checkOutEarlyReason: isEarlyOut ? earlyReason : null,
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
