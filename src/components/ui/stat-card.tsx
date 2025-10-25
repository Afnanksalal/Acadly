import { ReactNode } from "react"
import { Card, CardContent } from "./card"

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend 
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: { value: string; positive: boolean }
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
              {trend && (
                <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {icon && (
            <div className="rounded-full bg-primary/10 p-3 text-2xl">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
