import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { _count: { select: { users: true, branchProjects: true } } },
    });
    if (!branch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(branch);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(body.name != null && { name: String(body.name) }),
        ...(body.location != null && { location: body.location ? String(body.location) : null }),
        ...(body.lat != null && { lat: body.lat === '' ? null : Number(body.lat) }),
        ...(body.lng != null && { lng: body.lng === '' ? null : Number(body.lng) }),
        ...(body.radiusMeters != null && { radiusMeters: Number(body.radiusMeters) }),
      },
    });
    return NextResponse.json(branch);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });

    const donationIds = await prisma.donation.findMany({ where: { branchId: id }, select: { id: true } }).then((r) => r.map((d) => d.id));
    if (donationIds.length > 0) await prisma.donationEdit.deleteMany({ where: { donationId: { in: donationIds } } });
    await prisma.donation.deleteMany({ where: { branchId: id } });
    await prisma.branchProject.deleteMany({ where: { branchId: id } });
    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 403 });
  }
}
