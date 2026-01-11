'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

/* ============================================
   CUSTOM SELECT COMPONENT
   Premium dropdown with animations
   ============================================ */

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
  error?: boolean
  label?: string
  helperText?: string
}

export function Select({
  value,
  defaultValue,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
  size = "md",
  variant = "default",
  error = false,
  label,
  helperText,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || "")
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  // Sync with controlled value
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex]
          if (!option.disabled) {
            handleSelect(option.value)
          }
        } else {
          setIsOpen(true)
        }
        break
      case "Escape":
        setIsOpen(false)
        break
      case "ArrowDown":
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) => 
            prev < options.length - 1 ? prev + 1 : 0
          )
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex((prev) => 
            prev > 0 ? prev - 1 : options.length - 1
          )
        }
        break
    }
  }

  const handleSelect = (val: string) => {
    setSelectedValue(val)
    onChange?.(val)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const selectedOption = options.find((opt) => opt.value === selectedValue)

  // Size variants
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-base",
    lg: "h-13 px-5 text-lg",
  }

  // Style variants
  const variantClasses = {
    default: "bg-input border-border hover:border-primary/40",
    ghost: "bg-transparent border-transparent hover:bg-muted",
    outline: "bg-transparent border-primary/20 hover:border-primary/40",
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="select-listbox"
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full flex items-center justify-between gap-2",
          "rounded-lg border",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          sizeClasses[size],
          variantClasses[variant],
          error && "border-destructive focus:ring-destructive",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
      >
        <span className={cn(
          "truncate",
          !selectedOption && "text-muted-foreground"
        )}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-muted-foreground flex-shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <ul
          id="select-listbox"
          ref={listRef}
          role="listbox"
          className={cn(
            "absolute z-50 w-full mt-2",
            "bg-popover border border-border rounded-lg shadow-xl",
            "py-1 max-h-60 overflow-auto",
            "animate-scale-in origin-top",
            "scrollbar-thin"
          )}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={selectedValue === option.value}
              onClick={() => !option.disabled && handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "flex items-center justify-between gap-2 px-4 py-2.5 cursor-pointer transition-colors",
                selectedValue === option.value && "bg-primary/10 text-primary",
                highlightedIndex === index && selectedValue !== option.value && "bg-muted",
                option.disabled && "opacity-50 cursor-not-allowed",
                !option.disabled && "hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                {option.icon}
                {option.label}
              </span>
              {selectedValue === option.value && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </li>
          ))}
          
          {options.length === 0 && (
            <li className="px-4 py-3 text-center text-muted-foreground text-sm">
              No options available
            </li>
          )}
        </ul>
      )}

      {helperText && (
        <p className={cn(
          "mt-1.5 text-sm",
          error ? "text-destructive" : "text-muted-foreground"
        )}>
          {helperText}
        </p>
      )}
    </div>
  )
}

/* ============================================
   NATIVE SELECT (Fallback)
   For forms that need native behavior
   ============================================ */

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: boolean
  helperText?: string
}

export function NativeSelect({ 
  className, 
  children, 
  label,
  error,
  helperText,
  ...props 
}: NativeSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            "w-full h-11 px-4 pr-10 rounded-lg appearance-none",
            "bg-input text-foreground border border-border",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40",
            "transition-all duration-200",
            "cursor-pointer",
            error && "border-destructive focus:ring-destructive",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      {helperText && (
        <p className={cn(
          "mt-1.5 text-sm",
          error ? "text-destructive" : "text-muted-foreground"
        )}>
          {helperText}
        </p>
      )}
    </div>
  )
}
