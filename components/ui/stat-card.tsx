import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("glass-card rounded-2xl border-slate-200/80 dark:border-slate-800/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</CardTitle>
        {Icon && (
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1.5">
            {trend && (
              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold", trend.isPositive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400")}>
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
            {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

