"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ChatButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function startChat() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId })
      })

      if (res.ok) {
        const response = await res.json()
        console.log('Chat API response:', response) // Debug log
        const chatId = response.data?.chatId
        if (chatId) {
          console.log('Navigating to chat:', chatId) // Debug log
          router.push(`/chats/${chatId}`)
        } else {
          console.error('No chatId in response:', response)
          setError('Failed to start chat - no chat ID received')
        }
      } else {
        const errorData = await res.json()
        console.error('Chat API error:', errorData)
        setError(errorData.error?.message || "Failed to start chat")
      }
    } catch (error) {
      console.error("Chat error:", error)
      setError("Failed to start chat")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Button onClick={startChat} disabled={loading} className="w-full">
        {loading ? "Loading..." : "💬 Chat with Seller"}
      </Button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  )
}
