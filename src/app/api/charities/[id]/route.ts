import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { charityUpdateSchema, getZodErrorMessage } from '@/lib/validators';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const charity = await prisma.charity.findUnique({
      where: { id },
      include: { projects: true },
    });
    if (!charity) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(charity);
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
    const parsed = charityUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;
    const charity = await prisma.charity.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description ?? null }),
      },
    });
    return NextResponse.json(charity);
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
    const charity = await prisma.charity.findUnique({ where: { id }, include: { projects: { select: { id: true } } } });
    if (!charity) return NextResponse.json({ error: 'الجمعية غير موجودة' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      const projectIds = charity.projects.map((p) => p.id);
      if (projectIds.length > 0) {
        const donationIds = await tx.donation.findMany({ where: { projectId: { in: projectIds } }, select: { id: true } }).then((r) => r.map((d) => d.id));
        if (donationIds.length > 0) await tx.donationEdit.deleteMany({ where: { donationId: { in: donationIds } } });
        await tx.donation.deleteMany({ where: { projectId: { in: projectIds } } });
        await tx.branchProject.deleteMany({ where: { projectId: { in: projectIds } } });
        await tx.project.deleteMany({ where: { id: { in: projectIds } } });
      }
      await tx.charity.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Charity delete error:', e);
    return NextResponse.json({ error: 'فشل حذف الجمعية' }, { status: 403 });
  }
}
