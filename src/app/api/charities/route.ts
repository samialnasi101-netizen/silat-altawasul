import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();
    const list = await prisma.charity.findMany({
      include: { _count: { select: { projects: true } } },
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
    const charity = await prisma.charity.create({
      data: {
        name: String(body.name),
        description: body.description ? String(body.description) : null,
      },
    });
    return NextResponse.json(charity);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
