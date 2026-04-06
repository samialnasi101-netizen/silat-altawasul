import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(req: Request) {
  try {
    const session = await requireStaff();
    const { id: userId, role } = session.user;
    const url = new URL(req.url);
    const { page, limit, skip } = parsePagination(url);

    if (role === 'ADMIN') {
      const branchId = url.searchParams.get('branchId');
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');

      const where: Record<string, unknown> = {};
      if (branchId) where.user = { branchId };
      if (from || to) {
        where.checkInAt = {};
        if (from) (where.checkInAt as Record<string, Date>).gte = new Date(from);
        if (to) (where.checkInAt as Record<string, Date>).lte = new Date(to);
      }
      const whereClause = Object.keys(where).length ? where : undefined;

      const [list, total] = await Promise.all([
        prisma.attendanceRecord.findMany({
          where: whereClause,
          include: { user: { include: { branch: { select: { name: true } } } } },
          orderBy: { checkInAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.attendanceRecord.count({ where: whereClause }),
      ]);
      return NextResponse.json(paginatedResponse(list, total, page, limit));
    }

    const [list, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { userId },
        orderBy: { checkInAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.attendanceRecord.count({ where: { userId } }),
    ]);
    return NextResponse.json(paginatedResponse(list, total, page, limit));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
