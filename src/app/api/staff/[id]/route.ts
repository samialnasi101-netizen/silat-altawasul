import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { staffUpdateSchema, getZodErrorMessage } from '@/lib/validators';
import { MIN_PASSWORD_LENGTH } from '@/lib/constants';

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
    const parsed = staffUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { name, branchId, workStart, workEnd, password, active } = parsed.data;

    // Reject short password explicitly instead of silently ignoring
    if (password !== undefined && password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل` },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (branchId !== undefined) data.branchId = branchId ?? null;
    if (workStart !== undefined) data.workStart = workStart ?? null;
    if (workEnd !== undefined) data.workEnd = workEnd ?? null;
    if (active !== undefined) data.active = active;
    if (password && password.length >= MIN_PASSWORD_LENGTH) {
      data.passwordHash = await bcrypt.hash(password, 12);
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
    const session = await requireAdmin();
    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ error: 'لا يمكنك حذف حسابك الخاص' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    if (user.role === 'ADMIN') return NextResponse.json({ error: 'لا يمكن حذف حساب المدير' }, { status: 400 });

    const donationCount = await prisma.donation.count({ where: { userId: id } });
    const body = await req.json().catch(() => ({}));
    const confirmDeleteWithDonations = body.confirmDeleteWithDonations === true;

    if (donationCount > 0 && !confirmDeleteWithDonations) {
      return NextResponse.json(
        { error: HAS_DONATIONS_MESSAGE, hasDonations: true, donationCount },
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
