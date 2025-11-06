import { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 sm:py-2.5 rounded-md bg-muted text-sm sm:text-base text-foreground border border-border",
        "focus:ring-2 focus:ring-ring focus:outline-none",
        "transition-all duration-200 min-h-[44px] touch-manipulation",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
