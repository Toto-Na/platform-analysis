'use client'

// Lightweight fetch wrapper that always sends JSON and includes credentials.
// Throws on non-2xx with a parsed Arabic error message.

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export async function api<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `حدث خطأ (${res.status})`
    throw new ApiError(msg, res.status)
  }
  return data as T
}

export const apiGet = <T = any>(url: string) => api<T>(url, { method: 'GET' })
export const apiPost = <T = any>(url: string, body?: any) =>
  api<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
export const apiPut = <T = any>(url: string, body?: any) =>
  api<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined })
export const apiDelete = <T = any>(url: string) => api<T>(url, { method: 'DELETE' })
