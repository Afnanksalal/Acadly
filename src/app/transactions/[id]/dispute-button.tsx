"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DisputeButton({ transactionId }: { transactionId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          subject,
          description
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create dispute")
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        window.location.reload()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">⚠️ Open Dispute</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Open a Dispute</DialogTitle>
        </DialogHeader>
        
        {success ? (
          <Alert variant="success">
            <AlertDescription>
              Dispute created successfully! Admin will review within 24-48 hours.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                minLength={5}
                maxLength={200}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
                maxLength={2000}
                rows={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/2000 characters
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
                disabled={loading || !subject || !description}
                className="flex-1"
              >
                {loading ? "Submitting..." : "Submit Dispute"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
