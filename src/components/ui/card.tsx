import * as React from "react"
import { cn } from "@/lib/utils"

/* ============================================
   CARD COMPONENT
   Premium card with multiple variants
   ============================================ */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "glass" | "gradient"
  hover?: boolean
  glow?: boolean
  padding?: "none" | "sm" | "md" | "lg"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, glow = false, padding, ...props }, ref) => {
    const variantStyles = {
      default: "bg-card border border-border/50",
      elevated: "bg-card border border-border/30 shadow-xl",
      outlined: "bg-transparent border-2 border-primary/20",
      glass: "bg-card/60 backdrop-blur-xl border border-white/10",
      gradient: "bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-primary/20",
    }

    const paddingStyles = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl text-card-foreground",
          "transition-colors duration-200",
          variantStyles[variant],
          hover && "hover:border-primary/40",
          glow && "hover:shadow-glow",
          padding && paddingStyles[padding],
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-lg sm:text-xl font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 sm:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-3 p-5 sm:p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

/* ============================================
   FEATURE CARD
   Card with icon and highlight
   ============================================ */

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  iconColor?: string
  title: string
  description: string
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, icon, iconColor = "text-primary", title, description, ...props }, ref) => (
    <Card ref={ref} className={cn("group", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {icon && (
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-primary/10 group-hover:bg-primary/20 transition-colors",
              iconColor
            )}>
              {icon}
            </div>
          )}
          <div className="space-y-2">
            <h3 className="font-display font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
)
FeatureCard.displayName = "FeatureCard"

/* ============================================
   STAT CARD
   Card for displaying statistics
   ============================================ */

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: React.ReactNode
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, change, changeType = "neutral", icon, ...props }, ref) => {
    const changeColors = {
      positive: "text-success",
      negative: "text-destructive",
      neutral: "text-muted-foreground",
    }

    return (
      <Card ref={ref} className={className} {...props}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="font-display text-2xl sm:text-3xl font-bold">{value}</p>
              {change && (
                <p className={cn("text-sm font-medium", changeColors[changeType])}>
                  {change}
                </p>
              )}
            </div>
            {icon && (
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  FeatureCard,
  StatCard
}
