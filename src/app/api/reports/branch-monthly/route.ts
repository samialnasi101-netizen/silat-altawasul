import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const year = parseInt(url.searchParams.get('year') ?? '', 10);
    const month = parseInt(url.searchParams.get('month') ?? '', 10);
    if (!branchId || !year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'branchId, year, month مطلوبة' }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true },
    });
    if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    // Saudi time = UTC+3
    const start = new Date(Date.UTC(year, month - 1, 1, -3, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 20, 59, 59, 999));

    // Get all donations for this branch in this month
    const donations = await prisma.donation.findMany({
      where: {
        branchId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
        projectId: true,
        userId: true,
        createdAt: true,
      },
    });

    // Get all projects available in this branch
    const branchProjects = await prisma.branchProject.findMany({
      where: { branchId },
      include: {
        project: {
          include: { charity: { select: { name: true } } },
        },
      },
    });
    const projects = branchProjects.map((bp) => ({
      id: bp.project.id,
      name: bp.project.name,
      charityName: bp.project.charity.name,
    }));

    // Get all staff in this branch
    const staff = await prisma.user.findMany({
      where: { branchId, role: 'STAFF' },
      select: { id: true, name: true, staffId: true },
    });

    // Build daily breakdown by project
    const projectIds = projects.map((p) => p.id);
    const byDay: Record<number, Record<string, number>> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      byDay[d] = {};
      for (const pid of projectIds) byDay[d][pid] = 0;
    }

    // Build per-employee totals and counts in a single pass
    const byEmployee: Record<string, number> = {};
    const countByEmployee: Record<string, number> = {};
    for (const s of staff) {
      byEmployee[s.id] = 0;
      countByEmployee[s.id] = 0;
    }

    let grandTotal = 0;
    for (const d of donations) {
      const createdAt = d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt);
      const day = createdAt.getUTCDate();
      const amt = Number(d.amount);
      grandTotal += amt;
      if (!byDay[day]) byDay[day] = {};
      byDay[day][d.projectId] = (byDay[day][d.projectId] ?? 0) + amt;
      if (d.userId && byEmployee[d.userId] !== undefined) {
        byEmployee[d.userId] += amt;
        countByEmployee[d.userId] += 1;
      }
    }

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const byProject: Record<string, number> = {};
      let total = 0;
      for (const p of projects) {
        const val = byDay[d]?.[p.id] ?? 0;
        byProject[p.id] = val;
        total += val;
      }
      days.push({ day: d, byProject, total });
    }

    const employeeSummary = staff.map((s) => ({
      id: s.id,
      name: s.name,
      staffId: s.staffId,
      total: byEmployee[s.id] ?? 0,
      count: countByEmployee[s.id] ?? 0,
    }));

    return NextResponse.json({
      branchName: branch.name,
      year,
      month,
      daysInMonth,
      projects,
      days,
      employeeSummary,
      totalDonations: donations.length,
      grandTotal,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
