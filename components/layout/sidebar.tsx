"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { TrendingUp, BarChart3, Building2, Banknote, Globe, Bitcoin, Briefcase, LayoutDashboard, Settings, ChevronLeft, Flame, X } from "lucide-react"
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

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const navContent = (isMobile = false) => (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2 p-4 border-b border-border",
        !isMobile && collapsed ? "justify-center" : ""
      )}>
        <div className="rounded-lg bg-primary p-1.5 shrink-0">
          <TrendingUp className="h-4 w-4 text-primary-foreground" />
        </div>
        {(isMobile || !collapsed) && <span className="font-bold text-sm">InvestView</span>}
        {isMobile && (
          <button onClick={onMobileClose} className="ml-auto p-1 rounded hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        )}
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
              onClick={isMobile ? onMobileClose : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !isMobile && collapsed ? "justify-center px-2" : ""
              )}
              title={!isMobile && collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {(isMobile || !collapsed) && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-border space-y-0.5">
        <Link
          href="/perfil"
          onClick={isMobile ? onMobileClose : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            !isMobile && collapsed ? "justify-center px-2" : ""
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {(isMobile || !collapsed) && "Configurações"}
        </Link>
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ChevronLeft className={cn("h-4 w-4 shrink-0 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Recolher"}
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col h-full border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}>
        {navContent(false)}
      </aside>

      {/* Mobile drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col w-[280px] border-r border-border bg-card transition-transform duration-300 md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {navContent(true)}
      </aside>
    </>
  )
}
