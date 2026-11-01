'use client'

import { COMPARISON_STATUS_LABELS, COMPARISON_STATUS_COLORS, type ComparisonStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: ComparisonStatus | string }) {
  const label = COMPARISON_STATUS_LABELS[status as ComparisonStatus] ?? status
  const colors = COMPARISON_STATUS_COLORS[status as ComparisonStatus] ?? 'bg-slate-100 text-slate-700'
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors)}>
      {label}
    </span>
  )
}
