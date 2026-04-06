import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { donationUpdateSchema, getZodErrorMessage } from '@/lib/validators';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaff();
    const { id: userId, role } = session.user;
    const { id } = await params;

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (role !== 'ADMIN' && donation.userId !== userId) {
      return NextResponse.json({ error: 'Can only edit your own donations' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = donationUpdateSchema.safeParse({
      ...body,
      amount: body.amount != null ? Number(body.amount) : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { amount, note } = parsed.data;

    // Always record edit history — track who made the change (current user)
    await prisma.donationEdit.create({
      data: {
        donationId: id,
        userId,
        previousAmount: donation.amount,
        newAmount: amount,
      },
    });

    const updated = await prisma.donation.update({
      where: { id },
      data: { amount, ...(note !== undefined && { note: note ?? null }) },
      include: { project: { include: { charity: { select: { name: true } } } } },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Forbidden or invalid' }, { status: 403 });
  }
}
