import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { projectUpdateSchema, getZodErrorMessage } from '@/lib/validators';

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
    const parsed = projectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { name, branchIds } = parsed.data;

    await prisma.$transaction(async (tx) => {
      if (name !== undefined) {
        await tx.project.update({ where: { id }, data: { name } });
      }
      if (Array.isArray(branchIds)) {
        await tx.branchProject.deleteMany({ where: { projectId: id } });
        if (branchIds.length > 0) {
          await tx.branchProject.createMany({
            data: branchIds.map((branchId: string) => ({ projectId: id, branchId })),
          });
        }
      }
    });

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

    await prisma.$transaction(async (tx) => {
      const donationIds = await tx.donation.findMany({ where: { projectId: id }, select: { id: true } }).then((r) => r.map((d) => d.id));
      if (donationIds.length > 0) await tx.donationEdit.deleteMany({ where: { donationId: { in: donationIds } } });
      await tx.donation.deleteMany({ where: { projectId: id } });
      await tx.branchProject.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 403 });
  }
}
