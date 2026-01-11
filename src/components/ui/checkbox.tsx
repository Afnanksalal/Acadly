"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  description?: string
  size?: "sm" | "md" | "lg"
  error?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, size = "md", error, disabled, checked, onChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false)

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) {
        setIsChecked(e.target.checked)
        onChange?.(e)
      }
    }

    const sizeStyles = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    }

    const iconSizes = {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    }

    const labelSizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    }

    return (
      <label className={cn(
        "inline-flex items-start gap-3 cursor-pointer select-none group",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}>
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            ref={ref}
            checked={isChecked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div className={cn(
            sizeStyles[size],
            "rounded-md border-2",
            "flex items-center justify-center",
            isChecked
              ? "bg-primary border-primary"
              : "bg-transparent border-border",
            !disabled && !isChecked && "group-hover:border-primary/60",
            error && !isChecked && "border-destructive",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
          )}>
            <Check 
              className={cn(
                iconSizes[size],
                "text-primary-foreground",
                isChecked ? "opacity-100" : "opacity-0"
              )} 
              strokeWidth={3}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <span className={cn(
                labelSizes[size],
                "font-medium text-foreground leading-tight"
              )}>
                {label}
              </span>
            )}
            {description && (
              <span className="text-sm text-muted-foreground leading-snug">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
