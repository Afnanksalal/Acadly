import { cn } from "@/lib/utils"

export function Badge({ children, className, variant = "default" }: { children: React.ReactNode; className?: string; variant?: "default" | "secondary" | "success" | "destructive" }) {
  const styles = {
    default: "bg-primary/20 text-primary border border-primary/30",
    secondary: "bg-secondary/20 text-secondary border border-secondary/30",
    success: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30",
    destructive: "bg-red-600/20 text-red-400 border border-red-600/30",
  } as const
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs", styles[variant], className)}>{children}</span>
}
