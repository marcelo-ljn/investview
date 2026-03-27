"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { TrendingUp, BarChart3, Building2, Banknote, Globe, Bitcoin, Briefcase, LayoutDashboard, Settings, ChevronLeft, Flame } from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/acoes", label: "Ações", icon: TrendingUp },
  { href: "/fiis", label: "FIIs", icon: Building2 },
  { href: "/renda-fixa", label: "Renda Fixa", icon: Banknote },
  { href: "/etfs", label: "ETFs", icon: BarChart3 },
  { href: "/cripto", label: "Cripto", icon: Bitcoin },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/simulador", label: "Simulador FIRE", icon: Flame },
  { href: "/comparador", label: "Comparador", icon: Globe },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "flex flex-col h-full border-r border-border bg-card transition-all duration-300",
      collapsed ? "w-[60px]" : "w-[220px]"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center gap-2 p-4 border-b border-border", collapsed && "justify-center")}>
        <div className="rounded-lg bg-primary p-1.5 shrink-0">
          <TrendingUp className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-sm">InvestView</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-border space-y-0.5">
        <Link href="/perfil" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors", collapsed && "justify-center px-2")}>
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && "Configurações"}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ChevronLeft className={cn("h-4 w-4 shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Recolher"}
        </button>
      </div>
    </aside>
  )
}
