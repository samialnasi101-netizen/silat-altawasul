import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    const charityId = url.searchParams.get('charityId');
    const projectId = url.searchParams.get('projectId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = to ? new Date(to) : new Date();

    const where: { createdAt?: { gte: Date; lte: Date }; branchId?: string; projectId?: string; project?: { charityId?: string } } = {
      createdAt: { gte: fromDate, lte: toDate },
    };
    if (branchId) where.branchId = branchId;
    if (projectId) where.projectId = projectId;
    if (charityId) where.project = { charityId };

    const donations = await prisma.donation.findMany({
      where,
      include: {
        user: { select: { name: true, staffId: true } },
        branch: { select: { name: true } },
        project: { include: { charity: { select: { id: true, name: true } } } },
      },
    });

    const byBranch = new Map<string, { total: number; count: number }>();
    const byCharity = new Map<string, { total: number; count: number }>();
    const byProject = new Map<string, { total: number; count: number; charityName: string }>();
    const byEmployee = new Map<string, { total: number; count: number; name: string }>();

    for (const d of donations) {
      const amt = Number(d.amount);
      const b = byBranch.get(d.branchId) ?? { total: 0, count: 0 };
      b.total += amt;
      b.count += 1;
      byBranch.set(d.branchId, b);

      const cid = d.project.charity.id;
      const c = byCharity.get(cid) ?? { total: 0, count: 0 };
      c.total += amt;
      c.count += 1;
      byCharity.set(cid, c);

      const pid = d.projectId;
      const p = byProject.get(pid) ?? { total: 0, count: 0, charityName: d.project.charity.name };
      p.total += amt;
      p.count += 1;
      byProject.set(pid, p);

      const uid = d.userId;
      const u = byEmployee.get(uid) ?? { total: 0, count: 0, name: d.user.name };
      u.total += amt;
      u.count += 1;
      byEmployee.set(uid, u);
    }

    const branchNames = await prisma.branch.findMany({ where: { id: { in: Array.from(byBranch.keys()) } }, select: { id: true, name: true } });
    const charityNames = await prisma.charity.findMany({ where: { id: { in: Array.from(byCharity.keys()) } }, select: { id: true, name: true } });
    const projectNames = await prisma.project.findMany({ where: { id: { in: Array.from(byProject.keys()) } }, select: { id: true, name: true } });

    return NextResponse.json({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      donations: donations.length,
      totalAmount: donations.reduce((s, d) => s + Number(d.amount), 0),
      byBranch: Array.from(byBranch.entries()).map(([id, v]) => ({ id, ...v, name: branchNames.find((b) => b.id === id)?.name })),
      byCharity: Array.from(byCharity.entries()).map(([id, v]) => ({ id, ...v, name: charityNames.find((c) => c.id === id)?.name })),
      byProject: Array.from(byProject.entries()).map(([id, v]) => ({ id, ...v, name: projectNames.find((p) => p.id === id)?.name })),
      byEmployee: Array.from(byEmployee.entries()).map(([id, v]) => ({ id, ...v })),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
