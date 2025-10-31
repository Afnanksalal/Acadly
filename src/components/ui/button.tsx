import { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

import * as React from "react"

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { 
    variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost"
    size?: "default" | "sm" | "lg"
  }
>(({ 
  className, 
  variant = "primary", 
  size = "default",
  ...props 
}, ref) => {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none"
  
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    outline: "border border-primary/10 hover:bg-muted hover:border-primary/20 text-foreground transition-all",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    ghost: "hover:bg-muted hover:text-foreground"
  }

  const sizes: Record<string, string> = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 py-1 text-xs",
    lg: "h-12 px-6 py-3 text-base"
  }

  return <button ref={ref} {...props} className={cn(base, variants[variant], sizes[size], className)} />
})

Button.displayName = "Button"
