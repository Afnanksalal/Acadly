"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key: string | undefined
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: {
    name: string
    email: string
    contact: string
  }
  theme: {
    color: string
  }
  modal: {
    ondismiss: () => void
    escape: boolean
    backdropclose: boolean
  }
  retry: {
    enabled: boolean
    max_count: number
  }
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

type BuyButtonProps = {
  listingId: string
  price: string | number
  title: string
  buyerEmail?: string
  buyerName?: string
  buyerPhone?: string
  chatId?: string
  showFooterText?: boolean
  buttonLabel?: string
}

export function BuyButton({ 
  listingId, 
  price, 
  title,
  buyerEmail,
  buyerName,
  buyerPhone,
  chatId,
  showFooterText = true,
  buttonLabel
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const cancelTransaction = useCallback(async (transactionId: string) => {
    try {
      const cancelRes = await fetch(`/api/transactions/${transactionId}/cancel`, {
        method: "POST",
      })
      return cancelRes.ok
    } catch (cancelError) {
      console.error("Failed to cancel transaction:", cancelError)
      return false
    }
  }, [])

  const displayPrice = typeof price === "number" ? price : parseFloat(price)
  const formattedPrice = Number.isFinite(displayPrice) ? displayPrice : 0

  // Memoized script loader with singleton pattern
  const loadRazorpayScript = useCallback(() => {
    return new Promise<boolean>((resolve, reject) => {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        resolve(true)
        return
      }
      
      const scriptUrl = "https://checkout.razorpay.com/v1/checkout.js"
      const existingScript = document.querySelector(`script[src="${scriptUrl}"]`) as HTMLScriptElement | null
      
      if (existingScript) {
        if (existingScript.dataset.loaded === 'true') {
          resolve(true)
          return
        }
        
        // Script is loading, wait for it
        const onLoad = () => {
          existingScript.removeEventListener('load', onLoad)
          existingScript.removeEventListener('error', onError)
          resolve(true)
        }
        const onError = () => {
          existingScript.removeEventListener('load', onLoad)
          existingScript.removeEventListener('error', onError)
          reject(new Error('Failed to load payment gateway'))
        }
        existingScript.addEventListener('load', onLoad)
        existingScript.addEventListener('error', onError)
        return
      }
      
      // Create new script
      const script = document.createElement("script")
      script.src = scriptUrl
      script.async = true
      script.dataset.loading = 'true'
      
      script.onload = () => {
        script.dataset.loaded = 'true'
        script.dataset.loading = 'false'
        resolve(true)
      }
      script.onerror = () => {
        script.dataset.loading = 'false'
        reject(new Error('Failed to load payment gateway'))
      }
      
      document.body.appendChild(script)
    })
  }, [])

  async function handleBuy() {
    setLoading(true)
    setError("")

    try {
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        setError("Payment gateway is not configured. Please contact support.")
        setLoading(false)
        return
      }

      // Create transaction and Razorpay order
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          ...(chatId ? { chatId } : {})
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || "Failed to create order")
      }

      const response = await res.json()
      const { order, transaction } = response.data || response

      if (!order || !transaction) {
        console.error('Invalid response:', response)
        throw new Error("Invalid response from server")
      }

      const transactionId = transaction.id

      // Load Razorpay script
      try {
        await loadRazorpayScript()
      } catch {
        const cancelled = await cancelTransaction(transactionId)
        setError(cancelled
          ? "Failed to load payment gateway. Please refresh and try again."
          : "Failed to load payment gateway. Please refresh and try again. If you see this again, contact support."
        )
        setLoading(false)
        return
      }

      // Validate order object
      if (!order.amount || !order.currency || !order.id) {
        console.error('Invalid order:', order)
        throw new Error("Invalid payment order")
      }

      // Initialize Razorpay with production-ready options
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Acadly",
        description: title.length > 50 ? title.substring(0, 47) + '...' : title,
        order_id: order.id,
        handler: async function (response: RazorpayResponse) {
          try {
            // Verify payment signature
            const verifyRes = await fetch("/api/webhooks/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: transaction.id
              })
            })

            if (!verifyRes.ok) {
              const errorData = await verifyRes.json()
              console.error("Payment verification failed:", errorData)
              // Still redirect - webhook will handle it
            }

            // Redirect to transaction page
            router.push(`/transactions/${transaction.id}?success=true`)
          } catch (error) {
            console.error("Payment verification error:", error)
            // Redirect anyway - server webhook will handle verification
            router.push(`/transactions/${transaction.id}?success=true`)
          }
        },
        prefill: {
          name: buyerName || "",
          email: buyerEmail || "",
          contact: buyerPhone || ""
        },
        theme: {
          color: "#7c3aed"
        },
        modal: {
          ondismiss: async function() {
            const cancelled = await cancelTransaction(transactionId)
            setError(cancelled
              ? "Payment cancelled. You can try again."
              : "Payment cancelled, but we couldn't release the order. Please contact support."
            )
            setLoading(false)
          },
          escape: true,
          backdropclose: false
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      }

      const rzp = new window.Razorpay(options)
      
      rzp.on("payment.failed", async function (response) {
        const errorMsg = response.error?.description || "Payment failed"
        console.error("Payment failed:", errorMsg)
        const cancelled = await cancelTransaction(transactionId)
        setError(cancelled
          ? `Payment failed: ${errorMsg}. Please try again.`
          : `Payment failed: ${errorMsg}. Please contact support if you were charged.`
        )
        setLoading(false)
      })
      
      rzp.open()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initiate purchase"
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleBuy} 
        disabled={loading} 
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          buttonLabel || `Buy Now - ₹${formattedPrice.toLocaleString('en-IN')}`
        )}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {showFooterText && (
        <p className="text-xs text-center text-muted-foreground">
          OLX-style flow: pay securely, seller gets notified, pickup code shared after payment.
        </p>
      )}
    </div>
  )
}
