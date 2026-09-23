"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/ui/brand-mark"
import {
  LayoutDashboard,
  User,
  Package,
  Users,
  Megaphone,
  TrendingUp,
  Wrench,
  MessageSquare,
  BarChart3,
  HelpCircle,
  ShoppingBag,
  Tag,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const businessNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", href: "/dashboard/profile", icon: User },
  { title: "Management", href: "/dashboard/management", icon: Package },
  { title: "Employees", href: "/dashboard/employees", icon: Users },
  { title: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
  { title: "Sales", href: "/dashboard/sales", icon: TrendingUp },
  { title: "Service", href: "/dashboard/service", icon: Wrench },
  { title: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { title: "Support", href: "/dashboard/support", icon: HelpCircle },
]

export const personalNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", href: "/dashboard/profile", icon: User },
  { title: "Activities", href: "/dashboard/activities", icon: ShoppingBag },
  { title: "Offers", href: "/dashboard/offers", icon: Tag },
  { title: "Community", href: "/dashboard/community", icon: Heart },
  { title: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { title: "Support", href: "/dashboard/support", icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { mode, sidebarOpen, setSidebarOpen } = useStore()

  const navItems = mode === "business" ? businessNavItems : personalNavItems

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-[2px_0_15px_rgba(0,0,0,0.03)] transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 px-3">
          {sidebarOpen ? (
            <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden py-1">
              <BrandMark variant="icon" size="sm" />
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  Agentic CRM
                </span>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  by aiKart
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="mx-auto flex items-center justify-center">
              <BrandMark variant="icon" size="sm" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn("h-8 w-8 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white", !sidebarOpen && "hidden")}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="flex flex-col gap-1.5 p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const NavLink = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-full py-2.5 px-3.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100",
                    !sidebarOpen && "justify-center px-0 h-10 w-10 mx-auto rounded-full"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500 dark:text-slate-400")} />
                  {sidebarOpen && <span>{item.title}</span>}
                </Link>
              )

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                )
              }

              return NavLink
            })}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  )
}

