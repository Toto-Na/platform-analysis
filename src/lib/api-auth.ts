import { getServerSession } from 'next-auth'
import { authOptions, type AppSession } from '@/lib/auth'
import { db } from '@/lib/db'
import type { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

// Get the current session for App Router route handlers (no req/res needed).
export async function getSession(): Promise<AppSession | null> {
  return (await getServerSession(authOptions)) as AppSession | null
}

// Require authentication. Returns the session or a 401 Response.
export async function requireAuth(requiredRole: 'STUDENT' | 'ADMIN' | 'ANY' = 'ANY'): Promise<{ session: AppSession; error?: never } | { error: Response; session?: never }> {
  const session = await getSession()
  if (!session?.user) {
    return {
      error: new Response(JSON.stringify({ error: 'يجب تسجيل الدخول للوصول إلى هذه الخدمة' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }
  if (requiredRole !== 'ANY' && session.user.role !== requiredRole) {
    return {
      error: new Response(JSON.stringify({ error: 'لا تملك صلاحية الوصول إلى هذه الخدمة' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }
  return { session }
}

// Helper to read JSON body from a NextRequest
export async function readJson<T = any>(req: NextRequest): Promise<T> {
  try {
    const text = await req.text()
    return JSON.parse(text || '{}') as T
  } catch {
    return {} as T
  }
}

export function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export function errorJson(message: string, status = 400) {
  return json({ error: message }, status)
}

// Fetch the full user record (with profile) for the current session.
export async function getCurrentUserFull() {
  const session = await getSession()
  if (!session?.user) return null
  return db.user.findUnique({
    where: { id: session.user.id },
    include: { studentProfile: { include: { academicLevel: true } } },
  })
}
