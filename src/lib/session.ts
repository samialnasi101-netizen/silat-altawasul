import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export type AuthUser = {
  id: string;
  staffId: string;
  name: string;
  role: string;
  branchId?: string;
};

export type AuthSession = {
  user: AuthUser;
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden');
  return session as AuthSession;
}

export async function requireStaff(): Promise<AuthSession> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session as AuthSession;
}
