// Shared domain constants used across the app.
// Stored as plain string unions (SQLite has no enums); validated with zod in API routes.

export type Role = 'STUDENT' | 'ADMIN'

export type AnswerType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'RATING_1_5'
  | 'RATING_LEVELS'
  | 'YES_NO'
  | 'URL'

export const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  SHORT_TEXT: 'نص قصير',
  LONG_TEXT: 'نص طويل',
  SINGLE_CHOICE: 'اختيار واحد',
  MULTIPLE_CHOICE: 'اختيار متعدد',
  RATING_1_5: 'تقييم من 1 إلى 5',
  RATING_LEVELS: 'تقييم بمستويات',
  YES_NO: 'نعم / لا',
  URL: 'إدخال رابط',
}

export type ComparisonStatus =
  | 'DRAFT'
  | 'COMPLETED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_REVISION'
  | 'APPROVED'

export const COMPARISON_STATUS_LABELS: Record<ComparisonStatus, string> = {
  DRAFT: 'مسودة',
  COMPLETED: 'مكتمل',
  SUBMITTED: 'مرسل',
  UNDER_REVIEW: 'قيد المراجعة',
  NEEDS_REVISION: 'يحتاج إلى تعديل',
  APPROVED: 'معتمد',
}

export const COMPARISON_STATUS_COLORS: Record<ComparisonStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  COMPLETED: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  SUBMITTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  UNDER_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  NEEDS_REVISION: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
}

export type QuestionStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
export type CategoryStatus = 'ACTIVE' | 'ARCHIVED'
export type SetVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type AssignmentType = 'STUDENT_CHOICE' | 'FIXED' | 'OPTIONAL_ADD'
