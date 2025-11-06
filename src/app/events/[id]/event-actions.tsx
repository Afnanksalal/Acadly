"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, XCircle, CheckCircle } from "lucide-react"

export function EventActions({ eventId, currentStatus }: { eventId: string; currentStatus: string }) {
  const canCancel = currentStatus === "UPCOMING" || currentStatus === "ONGOING"
  const canComplete = currentStatus === "ONGOING"
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

  async function handleComplete() {
    if (!confirm("Mark this event as completed?")) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || "Failed to complete event")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete event")
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
      
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button
          variant="outline"
          onClick={() => window.location.href = `/events/${eventId}/edit`}
          disabled={loading}
          className="text-sm"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Event
        </Button>
        
        {canComplete && (
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? "Completing..." : "Complete Event"}
          </Button>
        )}
        
        {canCancel && (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
            className="text-sm"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {loading ? "Cancelling..." : "Cancel Event"}
          </Button>
        )}
      </div>
    </div>
  )
}
