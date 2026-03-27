"use client"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center gap-4 px-4">
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar ativo (ex: PETR4, HGLG11...)" className="pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            <Link href="/perfil">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? ""} />
                <AvatarFallback className="text-xs">{session.user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
