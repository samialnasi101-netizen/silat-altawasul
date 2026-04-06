import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await requireStaff();
    const { branchId } = await params;
    const { role, branchId: userBranchId } = session.user;

    if (role !== 'ADMIN' && userBranchId !== branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const list = await prisma.branchProject.findMany({
      where: { branchId },
      include: { project: { include: { charity: { select: { name: true } } } } },
    });
    return NextResponse.json(list.map((bp) => bp.project));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
