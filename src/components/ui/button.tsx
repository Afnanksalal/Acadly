import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

/* ============================================
   BUTTON COMPONENT
   Premium button with multiple variants
   ============================================ */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "link"
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "icon"
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  glow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    glow = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    // Base styles
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2",
      "font-medium rounded-lg",
      "transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "active:scale-[0.98]",
      "select-none"
    )

    // Variant styles
    const variantStyles = {
      primary: cn(
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90",
        "shadow-md hover:shadow-lg",
        glow && "hover:shadow-glow"
      ),
      secondary: cn(
        "bg-secondary text-secondary-foreground",
        "hover:bg-secondary/90",
        "shadow-md hover:shadow-lg"
      ),
      outline: cn(
        "border-2 border-primary/30 text-foreground bg-transparent",
        "hover:border-primary hover:bg-primary/10",
        "hover:text-primary"
      ),
      ghost: cn(
        "text-foreground bg-transparent",
        "hover:bg-muted hover:text-foreground"
      ),
      destructive: cn(
        "bg-destructive text-destructive-foreground",
        "hover:bg-destructive/90",
        "shadow-md hover:shadow-lg"
      ),
      success: cn(
        "bg-success text-success-foreground",
        "hover:bg-success/90",
        "shadow-md hover:shadow-lg"
      ),
      link: cn(
        "text-primary underline-offset-4",
        "hover:underline",
        "p-0 h-auto"
      ),
    }

    // Size styles
    const sizeStyles = {
      xs: "h-7 px-2.5 text-xs",
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-5 text-base",
      lg: "h-13 px-7 text-lg",
      xl: "h-14 px-8 text-xl",
      icon: "h-10 w-10 p-0",
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = "Button"

/* ============================================
   ICON BUTTON
   Compact button for icons only
   ============================================ */

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "xs" | "sm" | "md" | "lg"
  loading?: boolean
  tooltip?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    className, 
    variant = "ghost", 
    size = "md",
    loading = false,
    tooltip,
    disabled,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    const sizeStyles = {
      xs: "h-7 w-7",
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    }

    const iconSizes = {
      xs: "[&>svg]:h-3.5 [&>svg]:w-3.5",
      sm: "[&>svg]:h-4 [&>svg]:w-4",
      md: "[&>svg]:h-5 [&>svg]:w-5",
      lg: "[&>svg]:h-6 [&>svg]:w-6",
    }

    const variantStyles = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
      outline: "border border-border text-foreground hover:bg-muted hover:border-primary/40",
      ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
      destructive: "text-destructive hover:bg-destructive/10",
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        title={tooltip}
        className={cn(
          "inline-flex items-center justify-center rounded-lg",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95",
          sizeStyles[size],
          iconSizes[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          children
        )}
      </button>
    )
  }
)

IconButton.displayName = "IconButton"

/* ============================================
   BUTTON GROUP
   Group multiple buttons together
   ============================================ */

interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: "horizontal" | "vertical"
}

function ButtonGroup({ 
  children, 
  className,
  orientation = "horizontal" 
}: ButtonGroupProps) {
  return (
    <div 
      className={cn(
        "inline-flex",
        orientation === "horizontal" 
          ? "[&>button]:rounded-none [&>button:first-child]:rounded-l-lg [&>button:last-child]:rounded-r-lg [&>button:not(:last-child)]:border-r-0"
          : "flex-col [&>button]:rounded-none [&>button:first-child]:rounded-t-lg [&>button:last-child]:rounded-b-lg [&>button:not(:last-child)]:border-b-0",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Button, IconButton, ButtonGroup }
