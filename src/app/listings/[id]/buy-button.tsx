"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  }
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: (response: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export function BuyButton({ 
  listingId, 
  sellerId, 
  price, 
  title 
}: { 
  listingId: string
  sellerId: string
  price: string
  title: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleBuy() {
    setLoading(true)
    setError("")

    try {
      // Create transaction and Razorpay order
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          sellerId,
          amount: price
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || "Failed to create order")
      }

      const { order, transaction } = await res.json()

      // Load Razorpay script (check if already loaded)
      const loadRazorpayScript = () => {
        return new Promise((resolve, reject) => {
          // Check if script already exists
          if (window.Razorpay) {
            resolve(true)
            return
          }
          
          // Check if script tag already exists
          const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
          if (existingScript) {
            existingScript.addEventListener('load', () => resolve(true))
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay')))
            return
          }
          
          // Create new script
          const script = document.createElement("script")
          script.src = "https://checkout.razorpay.com/v1/checkout.js"
          script.async = true
          script.onload = () => resolve(true)
          script.onerror = () => reject(new Error('Failed to load Razorpay'))
          document.body.appendChild(script)
        })
      }

      try {
        await loadRazorpayScript()
      } catch {
        setError("Failed to load payment gateway")
        setLoading(false)
        return
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Acadly",
        description: title,
        order_id: order.id,
        handler: function () {
          // Payment successful
          router.push(`/transactions/${transaction.id}?success=true`)
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#7c3aed"
        },
        modal: {
          ondismiss: function() {
            setLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", function () {
        setError("Payment failed. Please try again.")
        setLoading(false)
      })
      rzp.open()

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate purchase")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleBuy} 
        disabled={loading} 
        className="w-full"
      >
        {loading ? "Processing..." : `Buy Now - ₹${price}`}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
