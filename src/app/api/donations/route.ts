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
    const projectId = url.searchParams.get('projectId');
    const charityId = url.searchParams.get('charityId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (role === 'ADMIN') {
      await requireAdmin();
      const where: Record<string, unknown> = {};
      if (branchId) where.branchId = branchId;
      if (projectId) where.projectId = projectId;
      if (charityId) where.project = { charityId };
      if (from || to) {
        where.createdAt = {};
        if (from) (where.createdAt as { gte?: Date }).gte = new Date(from);
        if (to) (where.createdAt as { lte?: Date }).lte = new Date(to);
      }
      const list = await prisma.donation.findMany({
        where: Object.keys(where).length ? where : undefined,
        include: {
          user: { select: { name: true, staffId: true } },
          branch: { select: { name: true } },
          project: { include: { charity: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      return NextResponse.json(list);
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const list = await prisma.donation.findMany({
      where: { userId },
      include: {
        project: { include: { charity: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id?: string }).id;
    const branchId = (session.user as { branchId?: string }).branchId;
    if (!userId || !branchId) return NextResponse.json({ error: 'No branch assigned' }, { status: 400 });

    const body = await req.json();
    const { projectId, amount, note } = body;
    const projectIdStr = String(projectId);

    const allowed = await prisma.branchProject.findUnique({
      where: { branchId_projectId: { branchId, projectId: projectIdStr } },
    });
    if (!allowed) return NextResponse.json({ error: 'Project not in your branch' }, { status: 403 });

    const donation = await prisma.donation.create({
      data: {
        amount: Number(amount),
        projectId: projectIdStr,
        userId,
        branchId,
        note: note ? String(note) : null,
      },
      include: {
        project: { include: { charity: { select: { name: true } } } },
      },
    });
    return NextResponse.json(donation);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
