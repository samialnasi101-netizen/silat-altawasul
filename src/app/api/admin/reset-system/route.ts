import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    await requireAdmin();

    await prisma.donationEdit.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.attendanceRecord.deleteMany({});
    await prisma.branchProject.deleteMany({});
    await prisma.user.deleteMany({ where: { role: 'STAFF' } });
    await prisma.user.updateMany({ data: { branchId: null } });
    await prisma.branch.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.charity.deleteMany({});
    await prisma.historicalReport.deleteMany({});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'فشل إعادة التعيين' }, { status: 403 });
  }
}
