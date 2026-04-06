import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { historicalReportSchema, getZodErrorMessage } from '@/lib/validators';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const report = await prisma.historicalReport.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(report);
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
    const parsed = historicalReportSchema.partial().safeParse({
      ...body,
      year: body.year != null ? Number(body.year) : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;
    const report = await prisma.historicalReport.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.reportDate !== undefined && { reportDate: data.reportDate ? new Date(data.reportDate) : null }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl ?? null }),
        ...(data.fileName !== undefined && { fileName: data.fileName ?? null }),
        ...(data.summary !== undefined && { summary: data.summary ?? null }),
      },
    });
    return NextResponse.json(report);
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
    await prisma.historicalReport.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
