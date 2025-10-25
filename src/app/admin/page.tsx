import { prisma } from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs } from "@/components/ui/tabs"
import { Profile, Dispute, Transaction } from "@prisma/client"

type DisputeWithTransaction = Dispute & {
  transaction: Transaction | null
}

export default async function AdminPage() {
  // Auth/role check
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Admin</h1>
          <p className="opacity-80">Please sign in.</p>
        </div>
      </main>
    )
  }
  let profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) return (
    <main className="min-h-screen flex items-center justify-center p-6"><div className="text-center"><h1 className="text-2xl font-semibold mb-2">Unauthorized</h1><p className="opacity-80">No profile.</p></div></main>
  )
  // Elevate admin by allowlist if configured
  const adminList = (process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
  if (adminList.includes((profile.email ?? "").toLowerCase()) && profile.role !== "ADMIN") {
    profile = await prisma.profile.update({ where: { id: profile.id }, data: { role: "ADMIN" } })
  }
  if (profile.role !== "ADMIN") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Unauthorized</h1>
          <p className="opacity-80">You must be an admin to access this page.</p>
        </div>
      </main>
    )
  }

  const [pending, disputes, kpi] = await Promise.all([
    prisma.profile.findMany({ where: { verified: false }, orderBy: { createdAt: "asc" }, take: 50 }),
    prisma.dispute.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 20, include: { transaction: true } }),
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
  ])
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardHeader><CardTitle>Users</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpi.users}</CardContent></Card>
        <Card><CardHeader><CardTitle>Verified</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpi.verified} <span className="text-sm opacity-70">({kpi.verifiedPct}%)</span></CardContent></Card>
        <Card><CardHeader><CardTitle>Active Listings</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpi.listings}</CardContent></Card>
        <Card><CardHeader><CardTitle>Transactions</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{kpi.txCount}</CardContent></Card>
      </section>

      <Tabs tabs={[{ id: "verifications", label: "Verifications" }, { id: "disputes", label: "Disputes" }]} />

      <section className="space-y-3" data-tab="verifications">
        <h2 className="text-xl font-medium">Pending Verifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pending.map((u: Profile) => (
            <form key={u.id} action={`/api/admin/verify`} method="post" className="border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{u.email}</div>
                <div className="text-sm opacity-70">{u.id}</div>
              </div>
              <input type="hidden" name="userId" value={u.id} />
              <button className="px-3 py-2 rounded-md bg-primary text-white">Verify</button>
            </form>
          ))}
        </div>
      </section>

      <section className="space-y-3" data-tab="disputes">
        <h2 className="text-xl font-medium">Open Disputes</h2>
        <div className="space-y-3">
          {disputes.map((d: DisputeWithTransaction) => (
            <div key={d.id} className="border border-border rounded-lg p-4">
              <div className="font-medium">{d.subject}</div>
              <div className="text-sm opacity-80">Tx: {d.transactionId}</div>
              <form action={`/api/admin/disputes/${d.id}/resolve`} method="post" className="mt-3 flex gap-2">
                <input type="hidden" name="action" value="RESOLVED" />
                <button className="px-3 py-2 rounded-md bg-secondary text-white">Mark Resolved</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
