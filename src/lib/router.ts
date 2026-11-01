'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export type Route = {
  view: string
  section?: string
  id?: string
  [key: string]: string | undefined
}

export function useAppRouter() {
  const router = useRouter()
  const sp = useSearchParams()

  const route: Route = useMemo(() => {
    const obj: Route = { view: sp.get('view') ?? 'home' }
    for (const key of sp.keys()) {
      obj[key] = sp.get(key) ?? undefined
    }
    return obj
  }, [sp])

  const navigate = useCallback(
    (params: Record<string, string | undefined>) => {
      const query = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') query.set(k, v)
      }
      const qs = query.toString()
      router.push(qs ? `/?${qs}` : '/')
    },
    [router],
  )

  const back = useCallback(() => router.back(), [router])

  return { route, navigate, back }
}
