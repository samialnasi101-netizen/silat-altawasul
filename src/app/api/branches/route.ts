import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();
    const list = await prisma.branch.findMany({
      include: { _count: { select: { users: true, branchProjects: true } } },
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
    const { name, location, lat, lng, radiusMeters } = body;
    const branch = await prisma.branch.create({
      data: {
        name: String(name),
        location: location ? String(location) : null,
        lat: lat != null ? Number(lat) : null,
        lng: lng != null ? Number(lng) : null,
        radiusMeters: radiusMeters != null ? Number(radiusMeters) : 500,
      },
    });
    return NextResponse.json(branch);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
