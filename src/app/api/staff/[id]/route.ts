import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { passwordHash: _omit, ...out } = user;
    void _omit;
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name != null) data.name = String(body.name);
    if (body.branchId != null) data.branchId = body.branchId ? String(body.branchId) : null;
    if (body.workStart != null) data.workStart = body.workStart ? String(body.workStart) : null;
    if (body.workEnd != null) data.workEnd = body.workEnd ? String(body.workEnd) : null;
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.password && String(body.password).length >= 6) {
      data.passwordHash = await bcrypt.hash(String(body.password), 12);
    }
    if (body.active === true) {
      await prisma.$executeRaw`UPDATE "User" SET active = true WHERE id = ${id}`;
      delete data.active;
    }
    if (Object.keys(data).length > 0) {
      await prisma.user.update({
        where: { id },
        data: data as never,
      });
    }
    const user = await prisma.user.findUnique({
      where: { id },
      include: { branch: { select: { name: true } } },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { passwordHash: _omit, ...out } = user;
    void _omit;
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}

const HAS_DONATIONS_MESSAGE =
  'هذا الموظف الذي تريد حذفه قد سجل تبرعات، وحذفك له قد يؤثر على سجلات التبرعات، الأفضل أن تعطل نشاط الموظف على أن تحذفه.';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    if (user.role === 'ADMIN') return NextResponse.json({ error: 'لا يمكن حذف حساب المدير' }, { status: 400 });

    const donationCount = await prisma.donation.count({ where: { userId: id } });
    const body = await req.json().catch(() => ({}));
    const confirmDeleteWithDonations = body.confirmDeleteWithDonations === true;

    if (donationCount > 0 && !confirmDeleteWithDonations) {
      return NextResponse.json(
        {
          error: HAS_DONATIONS_MESSAGE,
          hasDonations: true,
          donationCount,
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.includes('Foreign key') || message.includes('constraint')) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الموظف بسبب وجود بيانات مرتبطة. جرّب تعطيل الحساب بدلاً من الحذف.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 403 });
  }
}
