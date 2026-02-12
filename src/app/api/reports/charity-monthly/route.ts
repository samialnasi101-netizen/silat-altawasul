import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const charityId = url.searchParams.get('charityId');
    const year = parseInt(url.searchParams.get('year') ?? '', 10);
    const month = parseInt(url.searchParams.get('month') ?? '', 10);
    if (!charityId || !year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'charityId, year, month مطلوبة' }, { status: 400 });
    }

    const charity = await prisma.charity.findUnique({
      where: { id: charityId },
      include: { projects: { select: { id: true, name: true } } },
    });
    if (!charity) return NextResponse.json({ error: 'الجمعية غير موجودة' }, { status: 404 });

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - 1);

    const donations = await prisma.donation.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        project: { charityId },
      },
      select: {
        amount: true,
        projectId: true,
        createdAt: true,
      },
    });

    const projectIds = charity.projects.map((p) => p.id);
    const byDay: Record<number, Record<string, number>> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      byDay[d] = {};
      for (const pid of projectIds) byDay[d][pid] = 0;
    }

    for (const d of donations) {
      const createdAt = d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt);
      const day = createdAt.getUTCDate();
      if (!byDay[day]) byDay[day] = {};
      const amt = Number(d.amount);
      byDay[day][d.projectId] = (byDay[day][d.projectId] ?? 0) + amt;
    }

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const byProject: Record<string, number> = {};
      let total = 0;
      for (const p of charity.projects) {
        const val = byDay[d]?.[p.id] ?? 0;
        byProject[p.id] = val;
        total += val;
      }
      days.push({ day: d, byProject, total });
    }

    return NextResponse.json({
      charityName: charity.name,
      year,
      month,
      monthName: MONTH_NAMES[month - 1],
      projects: charity.projects,
      days,
      totalDonationsInRange: donations.length,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
