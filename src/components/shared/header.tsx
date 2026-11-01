'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User, GraduationCap, ShieldCheck } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'

type User = {
  name: string
  email: string
  role: 'STUDENT' | 'ADMIN'
  academicLevelName?: string | null
}

export function Header({ user, onNavigate }: { user: User; onNavigate: (p: Record<string, string>) => void }) {
  const initials = user.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate({ view: user.role === 'ADMIN' ? 'admin' : 'student', section: 'dashboard' })}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold leading-tight">منصة تحليل المواقع</div>
              <div className="text-xs text-muted-foreground leading-tight">الإلكترونية</div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-muted">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {initials || 'م'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium leading-tight">{user.name}</div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    {user.role === 'ADMIN' ? 'مدير' : user.academicLevelName ?? 'طالب'}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">حسابي</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer" onClick={() => onNavigate({ view: user.role === 'ADMIN' ? 'admin' : 'student', section: 'profile' })}>
                <User className="h-4 w-4 ml-2" />
                <span>الملف الشخصي</span>
              </DropdownMenuItem>
              {user.role === 'ADMIN' && (
                <DropdownMenuItem className="cursor-pointer" onClick={() => onNavigate({ view: 'admin', section: 'audit-logs' })}>
                  <ShieldCheck className="h-4 w-4 ml-2" />
                  <span>سجل العمليات</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-rose-600 focus:text-rose-700"
                onClick={() => signOut({ redirect: false }).then(() => onNavigate({ view: 'login' }))}
              >
                <LogOut className="h-4 w-4 ml-2" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
