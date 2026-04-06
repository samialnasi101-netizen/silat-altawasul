import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { donationCreateSchema, getZodErrorMessage } from '@/lib/validators';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(req: Request) {
  try {
    const session = await requireStaff();
    const { id: userId, role } = session.user;
    const url = new URL(req.url);
    const { page, limit, skip } = parsePagination(url);

    if (role === 'ADMIN') {
      const branchId = url.searchParams.get('branchId');
      const projectId = url.searchParams.get('projectId');
      const charityId = url.searchParams.get('charityId');
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');

      const where: Record<string, unknown> = {};
      if (branchId) where.branchId = branchId;
      if (projectId) where.projectId = projectId;
      if (charityId) where.project = { charityId };
      if (from || to) {
        where.createdAt = {};
        if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
        if (to) (where.createdAt as Record<string, Date>).lte = new Date(to);
      }
      const whereClause = Object.keys(where).length ? where : undefined;

      const [list, total] = await Promise.all([
        prisma.donation.findMany({
          where: whereClause,
          include: {
            user: { select: { name: true, staffId: true } },
            branch: { select: { name: true } },
            project: { include: { charity: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.donation.count({ where: whereClause }),
      ]);
      return NextResponse.json(paginatedResponse(list, total, page, limit));
    }

    const [list, total] = await Promise.all([
      prisma.donation.findMany({
        where: { userId },
        include: { project: { include: { charity: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.donation.count({ where: { userId } }),
    ]);
    return NextResponse.json(paginatedResponse(list, total, page, limit));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireStaff();
    const { id: userId, branchId } = session.user;
    if (!branchId) return NextResponse.json({ error: 'No branch assigned' }, { status: 400 });

    const body = await req.json();
    const parsed = donationCreateSchema.safeParse({
      ...body,
      amount: body.amount != null ? Number(body.amount) : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { projectId, amount, note } = parsed.data;

    const allowed = await prisma.branchProject.findUnique({
      where: { branchId_projectId: { branchId, projectId } },
    });
    if (!allowed) return NextResponse.json({ error: 'Project not in your branch' }, { status: 403 });

    const donation = await prisma.donation.create({
      data: {
        amount,
        projectId,
        userId,
        branchId,
        note: note ?? null,
      },
      include: { project: { include: { charity: { select: { name: true } } } } },
    });
    return NextResponse.json(donation);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
