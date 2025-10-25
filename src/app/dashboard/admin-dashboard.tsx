"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TabsClient } from "@/components/ui/tabs-client"
import { StatCard } from "@/components/ui/stat-card"
import { ResolveDisputeDialog } from "./resolve-dispute-dialog"
import { PendingUser, DisputeWithRelations, SerializedRecentListing } from "@/lib/types"

type AdminDashboardProps = {
  kpi: { users: number; verified: number; verifiedPct: number; listings: number; txCount: number }
  pending: PendingUser[]
  disputes: DisputeWithRelations[]
  recentListings: SerializedRecentListing[]
}

export function AdminDashboard({ kpi, pending, disputes, recentListings }: AdminDashboardProps) {
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your marketplace and users</p>
        </div>
        <Badge className="px-4 py-2 text-sm">Admin</Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={kpi.users}
          icon="👥"
          subtitle="Registered accounts"
        />
        <StatCard
          title="Verified Users"
          value={kpi.verified}
          icon="✅"
          subtitle={`${kpi.verifiedPct}% of total`}
        />
        <StatCard
          title="Active Listings"
          value={kpi.listings}
          icon="📦"
          subtitle="Currently available"
        />
        <StatCard
          title="Transactions"
          value={kpi.txCount}
          icon="💰"
          subtitle="All time"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/listings/new" className="group">
              <div className="rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:shadow-lg hover:scale-105">
                <div className="text-4xl mb-3">📝</div>
                <div className="font-medium group-hover:text-primary transition-colors">Create Listing</div>
              </div>
            </Link>
            <Link href="/listings" className="group">
              <div className="rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:shadow-lg hover:scale-105">
                <div className="text-4xl mb-3">🛍️</div>
                <div className="font-medium group-hover:text-primary transition-colors">Browse Listings</div>
              </div>
            </Link>
            <button className="group" onClick={() => document.getElementById('verifications')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:shadow-lg hover:scale-105">
                <div className="text-4xl mb-3">✅</div>
                <div className="font-medium group-hover:text-primary transition-colors">Verify Users</div>
              </div>
            </button>
            <button className="group" onClick={() => document.getElementById('disputes')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:shadow-lg hover:scale-105">
                <div className="text-4xl mb-3">⚖️</div>
                <div className="font-medium group-hover:text-primary transition-colors">Disputes</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <TabsClient
        tabs={[
          { id: "verifications", label: "Verifications", icon: "✅" },
          { id: "listings", label: "Recent Listings", icon: "📦" },
          { id: "disputes", label: "Disputes", icon: "⚖️" },
        ]}
        defaultTab="verifications"
      >
        {(activeTab) => (
          <>
            {activeTab === "verifications" && (
              <div id="verifications">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Pending Verifications</CardTitle>
                      <Badge variant="secondary">{pending.length} pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pending.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-lg font-medium mb-2">All caught up!</p>
                        <p className="text-sm text-muted-foreground">No pending verifications</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pending.map((u) => (
                          <div key={u.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                                👤
                              </div>
                              <div>
                                <div className="font-medium">{u.email}</div>
                                <div className="text-sm text-muted-foreground">
                                  Registered {new Date(u.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <form action="/api/admin/verify" method="post">
                              <input type="hidden" name="userId" value={u.id} />
                              <Button type="submit">Verify User</Button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "listings" && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentListings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-lg font-medium mb-2">No listings yet</p>
                      <p className="text-sm text-muted-foreground">Listings will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentListings.map((l) => (
                        <Link key={l.id} href={`/listings/${l.id}`}>
                          <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="font-medium text-lg">{l.title}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {l.category.name} • Posted by {l.user.email}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">₹{l.price.toString()}</div>
                              <Badge variant={l.type === "PRODUCT" ? "default" : "secondary"} className="mt-1">
                                {l.type}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "disputes" && (
              <div id="disputes">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Open Disputes</CardTitle>
                      <Badge variant="destructive">{disputes.length} open</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {disputes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">✨</div>
                        <p className="text-lg font-medium mb-2">No disputes</p>
                        <p className="text-sm text-muted-foreground">Everything is running smoothly</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {disputes.map((d) => (
                          <div key={d.id} className="border border-border rounded-lg p-5 hover:border-primary/50 transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{d.subject}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{d.description}</p>
                                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                                  <p><strong>Buyer:</strong> {d.transaction?.buyer?.email}</p>
                                  <p><strong>Seller:</strong> {d.transaction?.seller?.email}</p>
                                  <p><strong>Item:</strong> {d.transaction?.listing?.title}</p>
                                  <p><strong>Amount:</strong> ₹{d.transaction?.amount?.toString()}</p>
                                </div>
                              </div>
                              <Badge variant="destructive">Open</Badge>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="text-xs text-muted-foreground">
                                Reported: {new Date(d.createdAt).toLocaleDateString()}
                              </div>
                              <ResolveDisputeDialog dispute={d} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </TabsClient>
    </main>
  )
}
