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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    if (user.role === 'ADMIN') return NextResponse.json({ error: 'لا يمكن تعطيل حساب المدير' }, { status: 400 });

    await prisma.$executeRaw`UPDATE "User" SET active = false WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'فشل التعطيل' }, { status: 403 });
  }
}
