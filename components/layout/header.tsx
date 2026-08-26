"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store"
import { ModeToggle } from "./mode-toggle"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrandMark } from "@/components/ui/brand-mark"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search, Settings, LogOut, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function Header() {
  const { sidebarOpen } = useStore()
  const { user, businessProfile, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const userInitials = businessProfile?.ownerName
    ? businessProfile.ownerName.substring(0, 2).toUpperCase()
    : "JD"

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl transition-all duration-300",
        sidebarOpen ? "left-64" : "left-16",
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-slate-800">
            <BrandMark variant="icon" size="sm" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Agentic <span className="hm-grad font-bold">CRM</span>
            </span>
          </div>

          <div className="relative hidden md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search leads, campaigns, agents..."
              className="w-72 pl-9 h-9 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />

          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <Badge className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full p-0 text-[10px] bg-primary text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
              3
            </Badge>
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ""} alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold text-xs">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl glass-card p-1.5" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">{businessProfile?.ownerName || "Business Owner"}</p>
                  <p className="text-xs leading-none text-slate-500">{user?.email || "owner@business.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800 my-1" />
              <DropdownMenuItem className="rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => router.push("/dashboard/profile")}>
                <User className="mr-2 h-4 w-4 text-slate-500" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800 my-1" />
              <DropdownMenuItem className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4 text-red-500" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

