import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  if ((session.user as { role?: string }).role !== 'ADMIN') throw new Error('Forbidden');
  return session;
}

export async function requireStaff() {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  return session;
}
