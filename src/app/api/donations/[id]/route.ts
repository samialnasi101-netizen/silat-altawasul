import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role;
    const { id } = await params;

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (role !== 'ADMIN' && donation.userId !== userId) {
      return NextResponse.json({ error: 'Can only edit your own donations' }, { status: 403 });
    }

    const body = await req.json();
    const newAmount = body.amount != null ? Number(body.amount) : null;
    if (newAmount == null || newAmount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (donation.userId && donation.userId === userId) {
      await prisma.donationEdit.create({
        data: {
          donationId: id,
          userId: donation.userId,
          previousAmount: donation.amount,
          newAmount,
        },
      });
    }

    const updated = await prisma.donation.update({
      where: { id },
      data: { amount: newAmount, ...(body.note != null && { note: String(body.note) }) },
      include: {
        project: { include: { charity: { select: { name: true } } } },
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
