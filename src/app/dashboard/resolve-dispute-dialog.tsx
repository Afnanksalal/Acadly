"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DisputeWithRelations } from "@/lib/types"
import { apiRequest, getErrorMessage } from "@/lib/api-client"

export function ResolveDisputeDialog({ dispute }: { dispute: DisputeWithRelations }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resolution, setResolution] = useState("")
  const [action, setAction] = useState<"RESOLVED" | "REJECTED">("RESOLVED")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await apiRequest(`/api/admin/disputes/${dispute.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolution, action })
      })

      window.location.reload()
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Resolve</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Resolve Dispute</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dispute Details */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold">{dispute.subject}</h4>
            <p className="text-sm text-muted-foreground">{dispute.description}</p>
            <div className="pt-2 border-t border-border text-xs space-y-1">
              <p><strong>Buyer:</strong> {dispute.transaction?.buyer?.email}</p>
              <p><strong>Seller:</strong> {dispute.transaction?.seller?.email}</p>
              <p><strong>Item:</strong> {dispute.transaction?.listing?.title}</p>
              <p><strong>Amount:</strong> ₹{dispute.transaction?.amount?.toString()}</p>
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <Label>Decision</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={action === "RESOLVED" ? "primary" : "outline"}
                onClick={() => setAction("RESOLVED")}
                className="flex-1"
              >
                ✅ Resolve
              </Button>
              <Button
                type="button"
                variant={action === "REJECTED" ? "primary" : "outline"}
                onClick={() => setAction("REJECTED")}
                className="flex-1"
              >
                ❌ Reject
              </Button>
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <Label htmlFor="resolution">Resolution Notes</Label>
            <Textarea
              id="resolution"
              placeholder="Explain your decision and any actions taken..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
              rows={6}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {resolution.length}/1000 characters (min 10)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || resolution.length < 10}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Submit Decision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
