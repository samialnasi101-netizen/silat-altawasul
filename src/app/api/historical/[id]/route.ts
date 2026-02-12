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
    const report = await prisma.historicalReport.update({
      where: { id },
      data: {
        ...(body.title != null && { title: String(body.title) }),
        ...(body.year != null && { year: Number(body.year) }),
        ...(body.reportDate != null && { reportDate: body.reportDate ? new Date(body.reportDate) : null }),
        ...(body.fileUrl != null && { fileUrl: body.fileUrl ? String(body.fileUrl) : null }),
        ...(body.fileName != null && { fileName: body.fileName ? String(body.fileName) : null }),
        ...(body.summary != null && { summary: body.summary ? String(body.summary) : null }),
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
