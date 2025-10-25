import { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-muted/40 shadow-sm", className)}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-4 py-3 border-b border-border", className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-base font-medium", className)}>{children}</h3>
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4", className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-4 py-3 border-t border-border", className)}>{children}</div>
}
