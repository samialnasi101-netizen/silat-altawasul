import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      staffId: true,
      role: true,
      branchId: true,
      workStart: true,
      workEnd: true,
      branch: { select: { name: true, lat: true, lng: true, radiusMeters: true } },
    },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const branchNeedsLocation =
    user.branch != null &&
    user.branch.lat != null &&
    user.branch.lng != null &&
    user.branch.radiusMeters != null;
  return NextResponse.json({
    ...user,
    branchNeedsLocation,
  });
}
