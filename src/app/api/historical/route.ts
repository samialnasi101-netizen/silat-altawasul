import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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
    const { title, year, reportDate, fileUrl, fileName, summary } = body;
    const report = await prisma.historicalReport.create({
      data: {
        title: String(title),
        year: Number(year),
        reportDate: reportDate ? new Date(reportDate) : null,
        fileUrl: fileUrl ? String(fileUrl) : null,
        fileName: fileName ? String(fileName) : null,
        summary: summary ? String(summary) : null,
      },
    });
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
