import { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Alert({ children, className, variant = "default" }: { children: ReactNode; className?: string; variant?: "default" | "success" | "warning" | "destructive" }) {
  const styles = {
    default: "bg-muted/50 border-border text-foreground",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    warning: "bg-secondary/10 border-secondary/30 text-secondary",
    destructive: "bg-red-500/10 border-red-500/30 text-red-400",
  }
  return (
    <div className={cn("rounded-lg border p-4", styles[variant], className)}>
      {children}
    </div>
  )
}

export function AlertTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h5 className={cn("font-medium mb-1", className)}>{children}</h5>
}

export function AlertDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-sm opacity-90", className)}>{children}</div>
}
