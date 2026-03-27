"use client"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, Moon, Sun, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center gap-2 px-4 shrink-0">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search — hidden on mobile, visible sm+ */}
      <div className="hidden sm:flex flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar ativo (ex: PETR4, HGLG11...)" className="pl-9" />
      </div>

      {/* Search icon — mobile only */}
      <Button variant="ghost" size="icon" className="sm:hidden">
        <Search className="h-4 w-4" />
      </Button>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User */}
        {session?.user ? (
          <Link href="/perfil" className="ml-1">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? ""} />
              <AvatarFallback className="text-xs">{session.user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Button asChild size="sm" className="ml-1">
            <Link href="/login">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
