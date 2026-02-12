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
    const charity = await prisma.charity.update({
      where: { id },
      data: {
        ...(body.name != null && { name: String(body.name) }),
        ...(body.description != null && { description: body.description ? String(body.description) : null }),
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

    const projectIds = charity.projects.map((p) => p.id);
    if (projectIds.length > 0) {
      const donationIds = await prisma.donation.findMany({ where: { projectId: { in: projectIds } }, select: { id: true } }).then((r) => r.map((d) => d.id));
      if (donationIds.length > 0) await prisma.donationEdit.deleteMany({ where: { donationId: { in: donationIds } } });
      await prisma.donation.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.branchProject.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    }
    await prisma.charity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Charity delete error:', e);
    return NextResponse.json({ error: 'فشل حذف الجمعية' }, { status: 403 });
  }
}
