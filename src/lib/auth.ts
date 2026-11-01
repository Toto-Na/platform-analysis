import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان')
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { studentProfile: { include: { academicLevel: true } } },
        })
        if (!user) {
          throw new Error('لا يوجد حساب بهذا البريد الإلكتروني')
        }
        if (!user.isActive) {
          throw new Error('تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة')
        }
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) {
          throw new Error('كلمة المرور غير صحيحة')
        }
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          academicLevelId: user.studentProfile?.academicLevelId ?? null,
          academicLevelName: user.studentProfile?.academicLevel?.name ?? null,
        } as any
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: '/?view=login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.userId = (user as any).id
        token.academicLevelId = (user as any).academicLevelId ?? null
        token.academicLevelName = (user as any).academicLevelName ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId
        ;(session.user as any).role = token.role
        ;(session.user as any).academicLevelId = token.academicLevelId
        ;(session.user as any).academicLevelName = token.academicLevelName
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production-platform-zai-2026',
}

export type AppSession = {
  user: {
    id: string
    email: string
    name: string
    role: 'STUDENT' | 'ADMIN'
    academicLevelId: string | null
    academicLevelName: string | null
  }
}
