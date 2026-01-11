import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ============================================
   BADGE COMPONENT
   Premium badge with glow effects and variants
   ============================================ */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm hover:shadow-md hover:shadow-primary/20",
        secondary:
          "bg-secondary/80 text-secondary-foreground border border-secondary hover:bg-secondary",
        destructive:
          "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:border-red-500/50",
        outline: 
          "text-foreground border border-border/60 bg-background/50 hover:border-primary/40 hover:bg-muted/50",
        success:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50",
        warning:
          "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-500/50",
        info:
          "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 hover:border-blue-500/50",
        premium:
          "bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400/60",
        glass:
          "bg-white/5 backdrop-blur-sm text-foreground border border-white/10 hover:bg-white/10",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  dot?: boolean
  pulse?: boolean
}

function Badge({ 
  className, 
  variant, 
  size,
  icon,
  dot,
  pulse,
  children,
  ...props 
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          variant === "destructive" && "bg-red-400",
          variant === "success" && "bg-emerald-400",
          variant === "warning" && "bg-amber-400",
          variant === "info" && "bg-blue-400",
          variant === "default" && "bg-primary-foreground",
          (!variant || variant === "secondary" || variant === "outline") && "bg-foreground",
          pulse && "animate-pulse"
        )} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  )
}

/* ============================================
   STATUS BADGE
   Specialized badge for status indicators
   ============================================ */

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'active' | 'inactive'
}

function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  const statusConfig = {
    online: { variant: 'success' as const, label: 'Online' },
    offline: { variant: 'secondary' as const, label: 'Offline' },
    away: { variant: 'warning' as const, label: 'Away' },
    busy: { variant: 'destructive' as const, label: 'Busy' },
    pending: { variant: 'warning' as const, label: 'Pending' },
    active: { variant: 'success' as const, label: 'Active' },
    inactive: { variant: 'secondary' as const, label: 'Inactive' },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} dot pulse={status === 'online'} {...props}>
      {children || config.label}
    </Badge>
  )
}

/* ============================================
   COUNT BADGE
   Badge for displaying counts/numbers
   ============================================ */

interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number
  max?: number
  showZero?: boolean
}

function CountBadge({ count, max = 99, showZero = false, ...props }: CountBadgeProps) {
  if (count === 0 && !showZero) return null
  
  const displayCount = count > max ? `${max}+` : count.toString()
  
  return (
    <Badge {...props}>
      {displayCount}
    </Badge>
  )
}

export { Badge, StatusBadge, CountBadge, badgeVariants }