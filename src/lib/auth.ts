import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        staffId: { label: 'Staff ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.staffId || !credentials?.password) return null;
        const staffId = String(credentials.staffId).trim();
        const password = String(credentials.password).trim();
        if (!staffId || !password) return null;
        const user = await prisma.user.findUnique({
          where: { staffId },
          include: { branch: true },
        });
        if (!user) return null;
        const activeRow = await prisma.$queryRaw<[{ active: boolean | null }]>`SELECT active FROM "User" WHERE id = ${user.id}`;
        if (activeRow[0]?.active === false) return null; // deactivated account cannot login
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          staffId: user.staffId,
          name: user.name,
          role: user.role,
          branchId: user.branchId ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.staffId = (user as { staffId?: string }).staffId;
        token.role = (user as { role?: string }).role;
        token.branchId = (user as { branchId?: string }).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { staffId?: string }).staffId = token.staffId as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { branchId?: string }).branchId = token.branchId as string | undefined;
      }
      return session;
    },
  },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module 'next-auth' {
  interface User {
    id?: string;
    staffId?: string;
    role?: string;
    branchId?: string;
  }
  interface Session {
    user: User & { id?: string; staffId?: string; role?: string; branchId?: string };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    staffId?: string;
    role?: string;
    branchId?: string;
  }
}
