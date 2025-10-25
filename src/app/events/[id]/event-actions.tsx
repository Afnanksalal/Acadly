"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function EventActions({ eventId, currentStatus }: { eventId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this event?")) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || "Failed to cancel event")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => window.location.href = `/events/${eventId}/edit`}
          disabled={loading}
        >
          ✏️ Edit Event
        </Button>
        
        <Button
          variant="destructive"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? "Cancelling..." : "🚫 Cancel Event"}
        </Button>
      </div>
    </div>
  )
}
