import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const currentPassword = body.currentPassword ? String(body.currentPassword).trim() : '';
    const newPassword = body.newPassword ? String(body.newPassword).trim() : '';
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'كلمة المرور الحالية والجديدة مطلوبتان' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'فشل تغيير كلمة المرور' }, { status: 500 });
  }
}
