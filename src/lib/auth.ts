import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { rateLimit } from './rate-limit';

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

        // Rate limit: 5 attempts per minute per staffId
        const { allowed } = rateLimit(`login:${staffId}`, 5, 60 * 1000);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { staffId },
          include: { branch: true },
        });
        if (!user) return null;
        if (user.active === false) return null;
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
        token.staffId = user.staffId;
        token.role = user.role;
        token.branchId = user.branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.staffId = token.staffId;
        session.user.role = token.role;
        session.user.branchId = token.branchId;
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
    id: string;
    staffId: string;
    role: string;
    branchId?: string;
  }
  interface Session {
    user: { id: string; staffId: string; name: string; role: string; branchId?: string };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    staffId: string;
    role: string;
    branchId?: string;
  }
}
