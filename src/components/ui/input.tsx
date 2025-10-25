import { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full px-3 py-2 rounded-md bg-muted text-white border border-border focus:ring-2 focus:ring-ring", className)} {...props} />
}
