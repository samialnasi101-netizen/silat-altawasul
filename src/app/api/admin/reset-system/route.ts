import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { RESET_CONFIRM_PHRASE } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const confirmPhrase = body.confirmPhrase ? String(body.confirmPhrase).trim() : '';
    if (confirmPhrase !== RESET_CONFIRM_PHRASE) {
      return NextResponse.json(
        { error: `يجب كتابة "${RESET_CONFIRM_PHRASE}" للتأكيد` },
        { status: 400 }
      );
    }

    console.warn(`[SYSTEM RESET] initiated by admin ${session.user.staffId} (${session.user.id}) at ${new Date().toISOString()}`);

    await prisma.$transaction(async (tx) => {
      await tx.donationEdit.deleteMany({});
      await tx.donation.deleteMany({});
      await tx.attendanceRecord.deleteMany({});
      await tx.branchProject.deleteMany({});
      await tx.user.deleteMany({ where: { role: 'STAFF' } });
      await tx.user.updateMany({ data: { branchId: null } });
      await tx.branch.deleteMany({});
      await tx.project.deleteMany({});
      await tx.charity.deleteMany({});
      await tx.historicalReport.deleteMany({});
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'فشل إعادة التعيين' }, { status: 403 });
  }
}
