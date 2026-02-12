import { NextResponse } from 'next/server';
import { getSession, requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (role === 'ADMIN') {
      await requireAdmin();
      const where: { user?: { branchId?: string }; checkInAt?: { gte?: Date; lte?: Date } } = {};
      if (branchId) where.user = { branchId };
      if (from || to) {
        where.checkInAt = {};
        if (from) where.checkInAt.gte = new Date(from);
        if (to) where.checkInAt.lte = new Date(to);
      }
      const list = await prisma.attendanceRecord.findMany({
        where: Object.keys(where).length ? where : undefined,
        include: {
          user: { include: { branch: { select: { name: true } } } },
        },
        orderBy: { checkInAt: 'desc' },
        take: 500,
      });
      return NextResponse.json(list);
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const list = await prisma.attendanceRecord.findMany({
      where: { userId },
      orderBy: { checkInAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
