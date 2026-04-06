import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { branchCreateSchema, getZodErrorMessage } from '@/lib/validators';

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
    const parsed = branchCreateSchema.safeParse({
      ...body,
      lat: body.lat != null ? Number(body.lat) : null,
      lng: body.lng != null ? Number(body.lng) : null,
      radiusMeters: body.radiusMeters != null ? Number(body.radiusMeters) : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { name, location, lat, lng, radiusMeters } = parsed.data;
    const branch = await prisma.branch.create({
      data: {
        name,
        location: location ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        radiusMeters: radiusMeters ?? 500,
      },
    });
    return NextResponse.json(branch);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
