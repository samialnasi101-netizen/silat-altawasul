import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { branchUpdateSchema, getZodErrorMessage } from '@/lib/validators';

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
    const parsed = branchUpdateSchema.safeParse({
      ...body,
      lat: body.lat != null ? (body.lat === '' ? '' : Number(body.lat)) : undefined,
      lng: body.lng != null ? (body.lng === '' ? '' : Number(body.lng)) : undefined,
      radiusMeters: body.radiusMeters != null ? Number(body.radiusMeters) : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;
    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.location !== undefined && { location: data.location ?? null }),
        ...(data.lat !== undefined && { lat: data.lat ?? null }),
        ...(data.lng !== undefined && { lng: data.lng ?? null }),
        ...(data.radiusMeters !== undefined && { radiusMeters: data.radiusMeters }),
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

    await prisma.$transaction(async (tx) => {
      const donationIds = await tx.donation.findMany({ where: { branchId: id }, select: { id: true } }).then((r) => r.map((d) => d.id));
      if (donationIds.length > 0) await tx.donationEdit.deleteMany({ where: { donationId: { in: donationIds } } });
      await tx.donation.deleteMany({ where: { branchId: id } });
      await tx.branchProject.deleteMany({ where: { branchId: id } });
      await tx.branch.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 403 });
  }
}
