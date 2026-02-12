import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * Reset admin password when locked out.
 * Set ADMIN_RESET_SECRET in .env, then POST { "token": "<ADMIN_RESET_SECRET>", "newPassword": "your-new-password" }.
 * Remove or change ADMIN_RESET_SECRET after use.
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.ADMIN_RESET_SECRET;
    if (!secret || secret.length < 6) {
      return NextResponse.json(
        { error: 'إعادة تعيين كلمة المرور غير مفعّلة. أضف ADMIN_RESET_SECRET في .env' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const token = body.token ? String(body.token).trim() : '';
    const newPassword = body.newPassword ? String(body.newPassword).trim() : '';
    if (token !== secret) {
      return NextResponse.json({ error: 'رمز الاستعادة غير صحيح' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      return NextResponse.json({ error: 'لا يوجد حساب مدير. استخدم /api/setup أولاً.' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      ok: true,
      message: 'تم تغيير كلمة مرور المدير. سجّل الدخول بالكلمة الجديدة ثم احذف أو غيّر ADMIN_RESET_SECRET من .env.',
    });
  } catch (e) {
    console.error('Reset admin password error:', e);
    return NextResponse.json({ error: 'فشل إعادة التعيين' }, { status: 500 });
  }
}
