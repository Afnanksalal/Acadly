"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-muted shadow-lg rounded-lg p-8 text-center border border-border">
        <div className="mb-6">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Don&apos;t worry, our team has been notified.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
          >
            Try again
          </button>
          
          <Link
            href="/"
            className="block w-full bg-background text-foreground py-2 px-4 rounded-md hover:bg-muted transition-colors border border-border"
          >
            Go back home
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            If this problem persists, please contact{" "}
            <a
              href="mailto:support@acadly.in"
              className="text-primary hover:underline"
            >
              support@acadly.in
            </a>
          </p>
          
          {error.digest && (
            <p className="text-xs text-muted-foreground/70 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}