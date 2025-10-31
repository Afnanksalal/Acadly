"use client"
import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<ErrorBoundaryProps>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }

    console.error("Error Boundary caught an error:", errorDetails)

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(errorDetails)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  private async reportError(errorDetails: any) {
    try {
      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: 'Client-side error boundary triggered',
          context: errorDetails
        })
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private reset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} reset={this.reset} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="py-12 text-center space-y-6">
              <div className="space-y-2">
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold">Oops! Something went wrong</h2>
                <p className="text-sm text-muted-foreground">
                  We encountered an unexpected error. Our team has been notified.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left bg-muted p-4 rounded-lg text-sm">
                  <p className="font-mono text-destructive mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-muted-foreground">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button onClick={this.reset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/'}
                    className="gap-2 flex-1"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                  {process.env.NODE_ENV === 'production' && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/feedback?type=bug'}
                      className="gap-2 flex-1"
                    >
                      <Bug className="h-4 w-4" />
                      Report
                    </Button>
                  )}
                </div>
              </div>

              {this.state.errorId && (
                <p className="text-xs text-muted-foreground">
                  Reference: {this.state.errorId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('Unhandled error:', error, errorInfo)
    
    // Report to monitoring service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: 'Unhandled client-side error',
          context: {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            errorInfo,
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'unknown'
          }
        })
      }).catch(console.error)
    }
  }
}