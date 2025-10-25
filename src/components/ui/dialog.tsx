"use client"

import * as React from "react"

const Dialog = ({ open, onOpenChange, children }: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === DialogTrigger) {
            return React.cloneElement(child as React.ReactElement, { onClick: () => handleOpenChange(true) })
          }
          if (child.type === DialogContent) {
            return isOpen ? React.cloneElement(child as React.ReactElement, { onClose: () => handleOpenChange(false) }) : null
          }
        }
        return child
      })}
    </>
  )
}

const DialogTrigger = ({ children, onClick, asChild }: {
  children: React.ReactNode
  onClick?: () => void
  asChild?: boolean
}) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, { onClick })
  }
  return <div onClick={onClick}>{children}</div>
}

const DialogContent = ({ children, onClose, className }: {
  children: React.ReactNode
  onClose?: () => void
  className?: string
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-background rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 ${className || ''}`}>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children, className }: {
  children: React.ReactNode
  className?: string
}) => {
  return <div className={`mb-4 ${className || ''}`}>{children}</div>
}

const DialogTitle = ({ children, className }: {
  children: React.ReactNode
  className?: string
}) => {
  return <h2 className={`text-xl font-semibold ${className || ''}`}>{children}</h2>
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }
