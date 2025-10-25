import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminDashboard } from "./admin-dashboard"

export default async function DashboardPage() {
  const supabase = supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Welcome to collegemart</h1>
          <p className="opacity-80">Please sign in to continue.</p>
          <Link href="/auth/login" className="px-4 py-2 rounded-md bg-primary text-white inline-block">Login</Link>
        </div>
      </main>
    )
  }

  // ensure profile exists
  let profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) {
    profile = await prisma.profile.create({ data: { id: user.id, email: user.email ?? "" } })
  }

  const isAdmin = profile.role === "ADMIN"
  const gate = !profile.verified

  // Admin dashboard with everything
  if (isAdmin) {
    const [pending, disputes, kpi, recentListings] = await Promise.all([
      prisma.profile.findMany({ where: { verified: false }, orderBy: { createdAt: "asc" }, take: 10 }),
      prisma.dispute.findMany({ 
        where: { status: "OPEN" }, 
        orderBy: { createdAt: "desc" }, 
        take: 5, 
        include: { 
          transaction: {
            include: {
              buyer: true,
              seller: true,
              listing: true
            }
          }
        } 
      }),
      (async () => {
        const [users, verified, listings, txCount] = await Promise.all([
          prisma.profile.count(),
          prisma.profile.count({ where: { verified: true } }),
          prisma.listing.count({ where: { isActive: true } }),
          prisma.transaction.count(),
        ])
        const verifiedPct = users ? Math.round((verified / users) * 100) : 0
        return { users, verified, verifiedPct, listings, txCount }
      })(),
      prisma.listing.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { category: true, user: true } })
    ])

    // Serialize Decimal to string for client components
    const serializedListings = recentListings.map(l => ({
      ...l,
      price: l.price.toString()
    }))

    return <AdminDashboard kpi={kpi} pending={pending} disputes={disputes} recentListings={serializedListings} />
  }

  // Regular user dashboard
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground mt-2">Manage your listings and account</p>
      </div>

      {gate ? (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⏳</div>
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-semibold">Waiting for verification</h3>
                <p className="text-muted-foreground">
                  Your account is pending admin verification. You can browse listings, but buying/selling and messaging are disabled until verified.
                </p>
                <Link href="/listings">
                  <Button variant="outline">Browse Listings</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/listings/new" className="group">
                  <div className="rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:shadow-lg hover:scale-105">
                    <div className="text-4xl mb-3">📝</div>
                    <div className="font-medium group-hover:text-primary transition-colors">Create Listing</div>
                    <p className="text-xs text-muted-foreground mt-2">Sell your items</p>
                  </div>
                </Link>
                <Link href="/listings" className="group">
                  <div className="rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:shadow-lg hover:scale-105">
                    <div className="text-4xl mb-3">🛍️</div>
                    <div className="font-medium group-hover:text-primary transition-colors">Browse Listings</div>
                    <p className="text-xs text-muted-foreground mt-2">Find what you need</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="success">✓ Verified</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
