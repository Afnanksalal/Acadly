import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Search, X } from "lucide-react"

/* ============================================
   INPUT COMPONENT
   Premium input with multiple variants
   ============================================ */

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string | boolean
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: "sm" | "md" | "lg"
  variant?: "default" | "filled" | "outline"
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = "text",
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    inputSize = "md",
    variant = "default",
    fullWidth = true,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type

    // Size styles
    const sizeStyles = {
      sm: "h-9 text-sm px-3",
      md: "h-11 text-base px-4",
      lg: "h-13 text-lg px-5",
    }

    // Variant styles
    const variantStyles = {
      default: "bg-input border-border focus:border-primary/50",
      filled: "bg-muted border-transparent focus:bg-input focus:border-primary/50",
      outline: "bg-transparent border-primary/20 focus:border-primary/50",
    }

    const hasError = Boolean(error)

    return (
      <div className={cn("w-full", !fullWidth && "w-auto")}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cn(
              "w-full rounded-lg border",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              sizeStyles[inputSize],
              variantStyles[variant],
              leftIcon ? "pl-10" : "",
              (rightIcon || isPassword) ? "pr-10" : "",
              hasError && "border-destructive focus:ring-destructive focus:border-destructive",
              className
            )}
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
          
          {rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(helperText || hasError) && (
          <p className={cn(
            "mt-1.5 text-sm",
            hasError ? "text-destructive" : "text-muted-foreground"
          )}>
            {typeof error === "string" ? error : helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

/* ============================================
   SEARCH INPUT
   Specialized search input with clear button
   ============================================ */

interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon' | 'type'> {
  onClear?: () => void
  showClear?: boolean
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, showClear = true, ...props }, ref) => {
    const hasValue = Boolean(value)

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            "w-full h-11 pl-10 pr-10 rounded-lg",
            "bg-input border border-border",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50",
            className
          )}
          {...props}
        />
        {showClear && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"

/* ============================================
   TEXTAREA
   Multi-line text input
   ============================================ */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | boolean
  helperText?: string
  resize?: "none" | "vertical" | "horizontal" | "both"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label,
    error,
    helperText,
    resize = "vertical",
    disabled,
    ...props 
  }, ref) => {
    const hasError = Boolean(error)

    const resizeStyles = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            "w-full min-h-[120px] px-4 py-3 rounded-lg",
            "bg-input border border-border",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            resizeStyles[resize],
            hasError && "border-destructive focus:ring-destructive",
            className
          )}
          {...props}
        />
        
        {(helperText || hasError) && (
          <p className={cn(
            "mt-1.5 text-sm",
            hasError ? "text-destructive" : "text-muted-foreground"
          )}>
            {typeof error === "string" ? error : helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Input, SearchInput, Textarea }
