import { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" | "destructive" }) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2"
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:opacity-90",
    secondary: "bg-secondary text-white hover:opacity-90",
    outline: "border border-border hover:bg-muted",
    destructive: "bg-red-600 text-white hover:bg-red-700"
  }
  return <button {...props} className={cn(base, variants[variant], className)} />
}
