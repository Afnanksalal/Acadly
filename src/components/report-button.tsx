"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Flag, AlertCircle } from "lucide-react"

interface ReportButtonProps {
  targetType: "USER" | "LISTING" | "MESSAGE" | "REVIEW"
  targetId: string
  targetUserId?: string
  variant?: "destructive" | "secondary" | "outline" | "primary" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function ReportButton({
  targetType,
  targetId,
  targetUserId,
  variant = "outline",
  size = "sm",
  className = ""
}: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")

  const reasons = [
    { value: "SPAM", label: "Spam or Misleading" },
    { value: "HARASSMENT", label: "Harassment or Bullying" },
    { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content" },
    { value: "FRAUD", label: "Fraud or Scam" },
    { value: "FAKE_LISTING", label: "Fake Listing" },
    { value: "SCAM", label: "Scam Attempt" },
    { value: "VIOLENCE", label: "Violence or Threats" },
    { value: "HATE_SPEECH", label: "Hate Speech" },
    { value: "COPYRIGHT", label: "Copyright Violation" },
    { value: "OTHER", label: "Other" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason) {
      setError("Please select a reason")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          targetUser: targetUserId,
          reason,
          description: description || undefined,
          priority: reason === "VIOLENCE" || reason === "HARASSMENT" ? "HIGH" : "MEDIUM"
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to submit report")
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setReason("")
        setDescription("")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Flag className="h-4 w-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report {targetType.toLowerCase()}</DialogTitle>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-500/10 border-green-500/20">
            <AlertCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Report submitted successfully. Our team will review it shortly.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for report *</Label>
              <Select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason...</option>
                {reasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional details (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context that might help us review this report..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit Report"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              False reports may result in account restrictions. All reports are reviewed by our moderation team.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
