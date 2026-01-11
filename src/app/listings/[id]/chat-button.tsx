"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ChatButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()

  const startChat = useCallback(async (isRetry = false) => {
    setLoading(true)
    setError(null)
    
    const maxRetries = 3
    const currentRetry = isRetry ? retryCount + 1 : 0
    
    try {
      const res = await fetch("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId })
      })

      if (res.ok) {
        const response = await res.json()
        const chatId = response.data?.chatId
        if (chatId) {
          setRetryCount(0)
          router.push(`/chats/${chatId}`)
        } else {
          setError('Failed to start chat - no chat ID received')
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error?.message || "Failed to start chat")
      }
    } catch (error) {
      console.error("Chat error:", error)
      
      // Auto-retry on network errors with exponential backoff
      if (currentRetry < maxRetries) {
        setRetryCount(currentRetry)
        const delay = Math.pow(2, currentRetry) * 1000 // 1s, 2s, 4s
        setError(`Connection failed. Retrying in ${delay / 1000}s...`)
        
        setTimeout(() => {
          startChat(true)
        }, delay)
        return
      }
      
      setError("Failed to start chat. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [listingId, retryCount, router])

  return (
    <div className="w-full">
      <Button onClick={() => startChat(false)} disabled={loading} className="w-full">
        {loading ? "Loading..." : "💬 Chat with Seller"}
      </Button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  )
}
