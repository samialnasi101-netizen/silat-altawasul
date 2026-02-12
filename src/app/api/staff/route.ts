import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await requireAdmin();
    const list = await prisma.user.findMany({
      where: { role: 'STAFF' },
      include: { branch: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(list.map((u) => ({ ...u, passwordHash: undefined })));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { staffId, password, name, branchId, workStart, workEnd } = body;
    const existing = await prisma.user.findUnique({ where: { staffId: String(staffId) } });
    if (existing) return NextResponse.json({ error: 'Staff ID already exists' }, { status: 400 });
    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.create({
      data: {
        staffId: String(staffId),
        passwordHash,
        role: 'STAFF',
        name: String(name),
        branchId: branchId ? String(branchId) : null,
        workStart: workStart ? String(workStart) : null,
        workEnd: workEnd ? String(workEnd) : null,
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
