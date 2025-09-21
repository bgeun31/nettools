"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, Sun, Moon, LogOut } from "lucide-react"

interface HeaderProps {
  onLogout?: () => void
}

export function Header({ onLogout }: HeaderProps) {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark'
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="도구 또는 명령어 검색..." className="pl-10 w-80" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mounted ? (
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={isDark ? '라이트 모드' : '다크 모드'} aria-label="Toggle theme">
            <Sun className="w-4 h-4 hidden dark:inline-block" />
            <Moon className="w-4 h-4 dark:hidden" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" aria-label="Toggle theme">
            <Sun className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon">
          <User className="w-4 h-4" />
        </Button>
        {onLogout && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
