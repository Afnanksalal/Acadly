import { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full px-3 py-2 rounded-md bg-input text-foreground border border-primary/10 focus:ring-2 focus:ring-primary focus:border-primary/30 placeholder:text-muted-foreground transition-colors", className)} {...props} />
}
