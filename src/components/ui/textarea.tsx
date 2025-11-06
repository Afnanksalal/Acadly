import { TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 sm:py-2.5 rounded-md bg-muted text-sm sm:text-base text-foreground border border-border",
        "focus:ring-2 focus:ring-ring focus:outline-none resize-none",
        "transition-all duration-200 min-h-[44px] touch-manipulation",
        className
      )}
      {...props}
    />
  )
}
