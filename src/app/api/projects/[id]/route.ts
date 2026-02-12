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
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        charity: true,
        branchProjects: { include: { branch: true } },
      },
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(project);
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
    if (body.name != null) {
      await prisma.project.update({
        where: { id },
        data: { name: String(body.name) },
      });
    }
    if (Array.isArray(body.branchIds)) {
      await prisma.branchProject.deleteMany({ where: { projectId: id } });
      if (body.branchIds.length > 0) {
        await prisma.branchProject.createMany({
          data: body.branchIds.map((branchId: string) => ({ projectId: id, branchId })),
        });
      }
    }
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        charity: { select: { name: true } },
        branchProjects: { include: { branch: { select: { name: true } } } },
      },
    });
    return NextResponse.json(project);
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
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });

    const donationIds = await prisma.donation.findMany({ where: { projectId: id }, select: { id: true } }).then((r) => r.map((d) => d.id));
    if (donationIds.length > 0) await prisma.donationEdit.deleteMany({ where: { donationId: { in: donationIds } } });
    await prisma.donation.deleteMany({ where: { projectId: id } });
    await prisma.branchProject.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 403 });
  }
}
