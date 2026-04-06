import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { staffCreateSchema, getZodErrorMessage } from '@/lib/validators';

export async function GET() {
  try {
    await requireAdmin();
    const list = await prisma.user.findMany({
      where: { role: 'STAFF' },
      select: {
        id: true, staffId: true, name: true, role: true, active: true,
        branchId: true, workStart: true, workEnd: true, createdAt: true, updatedAt: true,
        branch: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = staffCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { staffId, password, name, branchId, workStart, workEnd } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { staffId } });
    if (existing) return NextResponse.json({ error: 'معرف الموظف مستخدم بالفعل' }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        staffId,
        passwordHash,
        role: 'STAFF',
        name,
        branchId: branchId ?? null,
        workStart: workStart ?? null,
        workEnd: workEnd ?? null,
      },
      include: { branch: { select: { name: true } } },
    });
    const { passwordHash: _omit, ...out } = user;
    void _omit;
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
