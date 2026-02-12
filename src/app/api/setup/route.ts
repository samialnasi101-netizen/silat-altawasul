import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * One-time setup: creates the default admin user if no admin exists.
 * Call GET /api/setup once after deploy. Then log in with admin / admin123
 */
export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      return NextResponse.json({
        ok: false,
        message: 'Admin user already exists. Use login page.',
      });
    }
    const passwordHash = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        staffId: 'admin',
        passwordHash,
        role: 'ADMIN',
        name: 'مدير النظام',
      },
    });
    return NextResponse.json({
      ok: true,
      message: 'Admin user created. Log in with: admin / admin123',
    });
  } catch (e) {
    const err = e as Error & { code?: string; meta?: unknown };
    console.error('Setup error:', e);
    const message = err.message || 'Unknown error';
    const code = err.code || (err as { code?: string }).code;
    return NextResponse.json(
      {
        ok: false,
        error: 'Setup failed. Check database connection.',
        detail: message,
        code: code ?? undefined,
        hint: message.includes("Can't reach") || message.includes('connect')
          ? 'Try: 1) Resume project in Supabase Dashboard. 2) Use Session pooler URL (port 6543) in .env - see Supabase Project Settings > Database.'
          : undefined,
      },
      { status: 500 }
    );
  }
}
