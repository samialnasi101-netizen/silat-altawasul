import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { branchId } = await params;
    const role = (session.user as { role?: string }).role;
    const userBranchId = (session.user as { branchId?: string }).branchId;
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
