import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();
    const list = await prisma.project.findMany({
      include: {
        charity: { select: { name: true } },
        branchProjects: { include: { branch: { select: { name: true } } } },
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
    const { name, charityId, branchIds } = body;
    const project = await prisma.project.create({
      data: {
        name: String(name),
        charityId: String(charityId),
        branchProjects: branchIds?.length
          ? { create: (branchIds as string[]).map((branchId: string) => ({ branchId })) }
          : undefined,
      },
      include: {
        charity: { select: { name: true } },
        branchProjects: { include: { branch: { select: { name: true } } } },
      },
    });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
