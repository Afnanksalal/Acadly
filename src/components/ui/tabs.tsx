"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

/* ============================================
   TABS COMPONENT
   Premium tabs with multiple variants
   ============================================ */

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "default" | "pills" | "underline" | "cards"
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-muted/50 p-1 rounded-xl border border-border/50",
    pills: "bg-transparent gap-2 p-0",
    underline: "bg-transparent border-b border-border rounded-none p-0 gap-0",
    cards: "bg-transparent gap-3 p-0",
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center justify-start text-muted-foreground",
        variantStyles[variant],
        className
      )}
      data-variant={variant}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode
  badge?: React.ReactNode
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, icon, badge, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium",
      "ring-offset-background transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Default variant styles
      "rounded-lg",
      "data-[state=active]:bg-background data-[state=active]:text-foreground",
      "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
      "hover:text-foreground/80",
      // Underline variant (when parent has data-variant="underline")
      "group-data-[variant=underline]:rounded-none group-data-[variant=underline]:border-b-2",
      "group-data-[variant=underline]:border-transparent group-data-[variant=underline]:px-4 group-data-[variant=underline]:pb-3",
      "group-data-[variant=underline]:data-[state=active]:border-primary group-data-[variant=underline]:data-[state=active]:bg-transparent",
      "group-data-[variant=underline]:data-[state=active]:shadow-none",
      // Pills variant
      "group-data-[variant=pills]:rounded-full group-data-[variant=pills]:px-5",
      "group-data-[variant=pills]:data-[state=active]:bg-primary group-data-[variant=pills]:data-[state=active]:text-primary-foreground",
      // Cards variant
      "group-data-[variant=cards]:rounded-xl group-data-[variant=cards]:border group-data-[variant=cards]:border-border/50",
      "group-data-[variant=cards]:px-5 group-data-[variant=cards]:py-3",
      "group-data-[variant=cards]:data-[state=active]:border-primary/50 group-data-[variant=cards]:data-[state=active]:bg-primary/5",
      className
    )}
    {...props}
  >
    {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
    {children}
    {badge && <span className="ml-1">{badge}</span>}
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "animate-fade-in",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }