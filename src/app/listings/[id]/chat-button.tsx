"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ChatButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function startChat() {
    setLoading(true)
    try {
      const res = await fetch("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId })
      })

      if (res.ok) {
        const { chatId } = await res.json()
        router.push(`/chats/${chatId}`)
      } else {
        const error = await res.json()
        alert(error.error?.message || "Failed to start chat")
      }
    } catch (error) {
      console.error("Chat error:", error)
      alert("Failed to start chat")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={startChat} disabled={loading} className="w-full">
      {loading ? "Loading..." : "💬 Chat with Seller"}
    </Button>
  )
}
