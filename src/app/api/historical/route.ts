import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { historicalReportSchema, getZodErrorMessage } from '@/lib/validators';

export async function GET() {
  try {
    await requireAdmin();
    const list = await prisma.historicalReport.findMany({
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
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
    const parsed = historicalReportSchema.safeParse({
      ...body,
      year: body.year != null ? Number(body.year) : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { title, year, reportDate, fileUrl, fileName, summary } = parsed.data;
    const report = await prisma.historicalReport.create({
      data: {
        title,
        year,
        reportDate: reportDate ? new Date(reportDate) : null,
        fileUrl: fileUrl ?? null,
        fileName: fileName ?? null,
        summary: summary ?? null,
      },
    });
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
