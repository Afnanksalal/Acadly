"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AutoRefresh({ 
  transactionId, 
  hasPickup, 
  isPaid 
}: { 
  transactionId: string
  hasPickup: boolean
  isPaid: boolean
}) {
  const router = useRouter()

  useEffect(() => {
    // Only auto-refresh if transaction is paid but no pickup code yet
    if (!isPaid || hasPickup) return

    const interval = setInterval(() => {
      router.refresh()
    }, 3000) // Check every 3 seconds

    // Stop checking after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [transactionId, hasPickup, isPaid, router])

  return null
}