import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PickupCodeDisplay } from "./pickup-code-display"
import { DisputeButton } from "./dispute-button"

export default async function TransactionPage({ 
  params,
  searchParams 
}: { 
  params: { id: string }
  searchParams: { success?: string }
}) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      buyer: true,
      seller: true,
      pickup: true
    }
  })

  if (!transaction) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg mb-4">Transaction not found</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Check if user is participant
  if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
    redirect("/dashboard")
  }

  const isBuyer = transaction.buyerId === user.id
  const isSeller = transaction.sellerId === user.id
  const showSuccess = searchParams.success === "true"

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {showSuccess && transaction.status === "PAID" && (
        <Alert variant="success">
          <AlertTitle>🎉 Payment Successful!</AlertTitle>
          <AlertDescription>
            Your payment has been processed successfully. {isBuyer && "Your pickup code is displayed below."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Transaction Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Order ID: {transaction.razorpayOrderId || transaction.id.substring(0, 8)}
              </p>
            </div>
            <Badge variant={
              transaction.status === "PAID" ? "success" :
              transaction.status === "INITIATED" ? "default" :
              transaction.status === "CANCELLED" ? "destructive" :
              "secondary"
            }>
              {transaction.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Listing Info */}
          <div>
            <h3 className="font-semibold mb-2">Item</h3>
            <Link href={`/listings/${transaction.listing.id}`}>
              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <p className="font-medium">{transaction.listing.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{transaction.listing.description}</p>
                <p className="text-lg font-bold text-primary mt-2">₹{transaction.amount.toString()}</p>
              </div>
            </Link>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Buyer</h3>
              <div className="p-3 border border-border rounded-lg">
                <p className="text-sm">{transaction.buyer.email}</p>
                {isBuyer && <Badge variant="default" className="mt-2">You</Badge>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Seller</h3>
              <div className="p-3 border border-border rounded-lg">
                <p className="text-sm">{transaction.seller.email}</p>
                {isSeller && <Badge variant="default" className="mt-2">You</Badge>}
              </div>
            </div>
          </div>

          {/* Pickup Code Section */}
          {transaction.status === "PAID" && transaction.pickup && (
            <PickupCodeDisplay
              pickup={transaction.pickup}
              isBuyer={isBuyer}
              isSeller={isSeller}
              transactionId={transaction.id}
            />
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex gap-3">
              <Link href="/orders" className="flex-1">
                <Button variant="outline" className="w-full">← Back to Orders</Button>
              </Link>
              {transaction.status === "PAID" && (
                <Link href={`/chats?listing=${transaction.listingId}`} className="flex-1">
                  <Button className="w-full">💬 Chat</Button>
                </Link>
              )}
            </div>
            <DisputeButton transactionId={transaction.id} />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
