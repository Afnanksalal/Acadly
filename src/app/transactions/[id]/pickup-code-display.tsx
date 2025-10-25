"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Pickup = {
  id: string
  pickupCode: string
  status: string
  confirmedAt: Date | null
}

export function PickupCodeDisplay({
  pickup,
  isBuyer,
  isSeller,
  transactionId
}: {
  pickup: Pickup
  isBuyer: boolean
  isSeller: boolean
  transactionId: string
}) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleConfirm() {
    if (code.length !== 6) {
      setError("Please enter the 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/pickups/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          pickupCode: code
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to confirm pickup")
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (pickup.status === "CONFIRMED") {
    return (
      <Card className="border-emerald-500/50 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✅ Pickup Confirmed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This transaction has been completed successfully.
          </p>
          {pickup.confirmedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Confirmed on {new Date(pickup.confirmedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {isBuyer && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔑 Your Pickup Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Show this code to the seller when you meet to collect the item.
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Pickup Code</p>
                <p className="text-5xl font-bold tracking-wider font-mono">
                  {pickup.pickupCode}
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>📍 Meet the seller at a safe, public location</p>
              <p>🔍 Verify the item condition before sharing the code</p>
              <p>✅ Seller will enter this code to confirm pickup</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isSeller && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 Confirm Pickup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="warning">
              <AlertDescription>
                Ask the buyer for their 6-digit pickup code and enter it below to confirm the transaction.
              </AlertDescription>
            </Alert>

            {success ? (
              <Alert variant="success">
                <AlertDescription>
                  ✅ Pickup confirmed! Transaction complete. Refreshing...
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Enter Buyer&apos;s Pickup Code
                  </label>
                  <Input
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-wider"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleConfirm} 
                  disabled={loading || code.length !== 6}
                  className="w-full"
                >
                  {loading ? "Confirming..." : "Confirm Pickup"}
                </Button>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>⚠️ Only confirm after you&apos;ve handed over the item</p>
                  <p>🔒 This action cannot be undone</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
