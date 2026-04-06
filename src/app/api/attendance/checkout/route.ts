import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { parseWorkTimeToSaudiToday } from '@/lib/saudi-time';
import { isWithinBranchRadius } from '@/lib/geo';
import { checkoutSchema, getZodErrorMessage } from '@/lib/validators';
import { POST_WORK_CHECKOUT_WINDOW_MINUTES, DEFAULT_WORK_END, MIN_REASON_LENGTH } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const session = await requireStaff();
    const { id: userId } = session.user;

    const body = await req.json().catch(() => ({}));
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { earlyReason, lat, lng } = parsed.data;

    const open = await prisma.attendanceRecord.findFirst({
      where: { userId, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
      include: { user: { include: { branch: true } } },
    });
    if (!open) return NextResponse.json({ error: 'No open attendance' }, { status: 400 });

    const now = new Date();
    const workEnd = open.user.workEnd || DEFAULT_WORK_END;
    const workEndToday = parseWorkTimeToSaudiToday(workEnd);
    const latestCheckOut = new Date(workEndToday.getTime() + POST_WORK_CHECKOUT_WINDOW_MINUTES * 60 * 1000);

    if (now < workEndToday) {
      return NextResponse.json(
        { error: `يمكن تسجيل الانصراف من نهاية الدوام (${workEnd}) حتى ${POST_WORK_CHECKOUT_WINDOW_MINUTES} دقيقة بعدها فقط.` },
        { status: 400 }
      );
    }
    if (now > latestCheckOut) {
      return NextResponse.json(
        { error: `انتهى وقت تسجيل الانصراف يدوياً (${POST_WORK_CHECKOUT_WINDOW_MINUTES} دقيقة بعد نهاية الدوام). سيتم إغلاق الحضور تلقائياً عند فتح الصفحة.` },
        { status: 400 }
      );
    }

    const branch = open.user.branch;
    if (branch?.lat != null && branch?.lng != null && branch?.radiusMeters != null) {
      if (lat == null || lng == null) {
        return NextResponse.json(
          { error: 'يجب تفعيل الموقع وأن تكون داخل نطاق الفرع لتسجيل الانصراف.' },
          { status: 400 }
        );
      }
      if (!isWithinBranchRadius(lat, lng, branch.lat, branch.lng, branch.radiusMeters)) {
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
        checkOutEarlyReason: earlyReason && earlyReason.trim().length >= MIN_REASON_LENGTH ? earlyReason.trim() : null,
      },
    });
    return NextResponse.json(record);
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: 'Server error', detail: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : undefined) : undefined },
      { status: 500 }
    );
  }
}
