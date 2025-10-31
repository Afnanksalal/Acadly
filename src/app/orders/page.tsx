import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function OrdersPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile?.verified) redirect("/dashboard")

  // Get purchases (as buyer)
  const purchases = await prisma.transaction.findMany({
    where: { buyerId: user.id },
    include: {
      listing: { include: { category: true } },
      seller: true,
      pickup: true
    },
    orderBy: { createdAt: "desc" }
  })

  // Get sales (as seller)
  const sales = await prisma.transaction.findMany({
    where: { sellerId: user.id },
    include: {
      listing: { include: { category: true } },
      buyer: true,
      pickup: true
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground mt-2">Track your purchases and sales</p>
      </div>

      {/* Purchases */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">🛒 My Purchases ({purchases.length})</h2>
        {purchases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg font-medium mb-2">No purchases yet</p>
              <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here</p>
              <Link href="/listings">
                <Button>Browse Listings</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {purchases.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{order.listing.title}</h3>
                          <Badge variant={
                            order.status === "PAID" && order.pickup?.status === "CONFIRMED" ? "success" :
                            order.status === "PAID" ? "default" :
                            order.status === "CANCELLED" ? "destructive" :
                            "secondary"
                          }>
                            {order.pickup?.status === "CONFIRMED" ? "Completed" : order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Seller: {order.seller.email?.split('@')[0]} • {order.listing.category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ordered on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        {order.status === "PAID" && order.pickup && order.pickup.status === "GENERATED" && (
                          <div className="mt-3 p-3 bg-primary/10 rounded-md">
                            <p className="text-sm font-medium mb-1">🔑 Your Pickup Code:</p>
                            <p className="text-2xl font-bold font-mono tracking-wider">{order.pickup.pickupCode}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{order.amount.toString()}</p>
                        <Button variant="outline" className="mt-2">View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Sales */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">💰 My Sales ({sales.length})</h2>
        {sales.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">💼</div>
              <p className="text-lg font-medium mb-2">No sales yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create listings to start selling</p>
              <Link href="/listings/new">
                <Button>Create Listing</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sales.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{order.listing.title}</h3>
                          <Badge variant={
                            order.status === "PAID" && order.pickup?.status === "CONFIRMED" ? "success" :
                            order.status === "PAID" ? "default" :
                            order.status === "CANCELLED" ? "destructive" :
                            "secondary"
                          }>
                            {order.pickup?.status === "CONFIRMED" ? "Completed" : 
                             order.status === "PAID" ? "Awaiting Pickup" : order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Buyer: {order.buyer.email?.split('@')[0]} • {order.listing.category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sold on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        {order.status === "PAID" && order.pickup && order.pickup.status === "GENERATED" && (
                          <div className="mt-3 p-3 bg-secondary/10 rounded-md">
                            <p className="text-sm font-medium text-secondary">⏳ Waiting for buyer pickup</p>
                            <p className="text-xs text-muted-foreground mt-1">Ask buyer for their code to confirm</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{order.amount.toString()}</p>
                        <Button variant="outline" className="mt-2">
                          {order.pickup?.status === "GENERATED" ? "Confirm Pickup" : "View Details"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
